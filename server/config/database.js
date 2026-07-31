const dns = require('node:dns');
const mongoose = require('mongoose');
const { config } = require('./env');

let isConnected = false;

/**
 * Safely scrubs MONGODB_URI, usernames, passwords, and sensitive cluster hostnames from error strings.
 */
const sanitizeErrorMessage = (error) => {
  let msg = error && error.message ? error.message : String(error);
  
  // Scrub exact MongoDB URI if present
  if (config.mongoUri && config.mongoUri.trim() !== '') {
    msg = msg.split(config.mongoUri).join('[SANiTIZED_MONGODB_URI]');
    // Clean user/password regex matches from standard mongodb(+) connection URIs
    const credMatch = config.mongoUri.match(/:\/\/(?:([^:@]+):([^@]+)@)?/);
    if (credMatch) {
      if (credMatch[1]) msg = msg.split(credMatch[1]).join('[SANiTIZED_USERNAME]');
      if (credMatch[2]) msg = msg.split(credMatch[2]).join('[SANiTIZED_PASSWORD]');
    }
  }

  // Generic scrub for any remaining MongoDB connection strings
  msg = msg.replace(/mongodb(?:\+srv)?:\/\/[^\s"',]+/ig, '[SANiTIZED_MONGODB_URI]');
  return msg;
};

/**
 * Classifies MongoDB connection errors into explicit diagnostic categories without exposing credentials.
 */
const categorizeMongoError = (error, safeMessage) => {
  const name = error?.name || '';
  const code = error?.code || error?.codeName || '';
  const lowerMsg = (safeMessage || '').toLowerCase();

  // 1. Invalid connection string
  if (name === 'MongoParseError' || lowerMsg.includes('invalid scheme') || lowerMsg.includes('invalid uri') || lowerMsg.includes('malformed') || lowerMsg.includes('parse error')) {
    return 'Invalid connection string';
  }

  // 2. DNS SRV lookup failed
  if (lowerMsg.includes('querysrv') || lowerMsg.includes('enotfound') || lowerMsg.includes('srv') || lowerMsg.includes('eservfail') || lowerMsg.includes('getaddrinfo')) {
    return 'DNS SRV lookup failed';
  }

  // 3. Authentication failed
  if (code === 8000 || code === 18 || lowerMsg.includes('auth') || lowerMsg.includes('authentication') || lowerMsg.includes('bad auth') || lowerMsg.includes('sasl') || lowerMsg.includes('unauthorized') || lowerMsg.includes('user') || lowerMsg.includes('password')) {
    return 'Authentication failed';
  }

  // 4. IP address not allowed
  if (lowerMsg.includes('whitelist') || lowerMsg.includes('not whitelisted') || lowerMsg.includes('ip address') || lowerMsg.includes('not allowed') || lowerMsg.includes('access denied') || lowerMsg.includes('firewall') || lowerMsg.includes('tlsv1 alert') || lowerMsg.includes('connection refused') || lowerMsg.includes('blocked')) {
    return 'IP address not allowed';
  }

  // 5. Server selection timeout
  if (name === 'ServerSelectionTimeoutError' || name === 'MongoTimeoutError' || code === 50 || lowerMsg.includes('timeout') || lowerMsg.includes('server selection') || lowerMsg.includes('timed out')) {
    return 'Server selection timeout';
  }

  return 'General MongoDB Cluster or Network Error';
};

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || config.mongoUri;
    if (!mongoURI || mongoURI.trim() === '') {
      console.warn('⚠️ [MongoDB Notice] MONGODB_URI is not defined in server/.env.');
      console.warn('⚠️ Server will run in offline demo mode. Admin-entered & simulated sample data will be rendered.');
      return false;
    }

    const isDevelopment = config.nodeEnv === 'development' || process.env.NODE_ENV === 'development';
    const configuredDnsServers = process.env.MONGODB_DNS_SERVERS || config.mongoDnsServers;

    if (configuredDnsServers || isDevelopment) {
      try {
        let serverList = configuredDnsServers
          ? configuredDnsServers.split(',').map(s => s.trim()).filter(Boolean)
          : [];
        if (serverList.length === 0 && isDevelopment) {
          serverList = [
            '8.8.8.8',
            '8.8.4.4',
            '1.1.1.1'
          ];
        }
        if (serverList.length > 0) {
          dns.setServers(serverList);
          console.log(`🌐 Configured Node.js DNS resolvers: ${serverList.join(', ')}`);
        }
      } catch (dnsError) {
        console.warn('⚠️ Could not configure custom DNS resolvers:', dnsError.message);
      }
    }

    if (isDevelopment) {
      try {
        const records = await new Promise((resolve, reject) => {
          dns.resolveSrv('_mongodb._tcp.nandha.vku4sbv.mongodb.net', (err, addresses) => {
            if (err) reject(err);
            else resolve(addresses || []);
          });
        });
        console.log(`🔍 [DEV DIAGNOSTICS] SRV lookup succeeded (${records.length} records returned).`);
      } catch (srvError) {
        console.warn('🔍 [DEV DIAGNOSTICS] SRV lookup failed without returning records.');
      }
    }

    // Connect using safe options without logging passwords or connection URIs
    const conn = await mongoose.connect(process.env.MONGODB_URI || mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log('✅ MongoDB connected successfully.');
    
    // Handle subsequent connection events safely
    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('⚠️ MongoDB connection lost. Attempting auto-reconnection when network allows...');
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      console.log('✅ MongoDB reconnected successfully.');
    });

    return true;
  } catch (error) {
    isConnected = false;
    const safeMsg = sanitizeErrorMessage(error);
    const category = categorizeMongoError(error, safeMsg);

    if (config.nodeEnv === 'development' || process.env.NODE_ENV === 'development') {
      // 1. Log detailed error diagnostic only in development mode without credentials
      console.error('\n======================================================');
      console.error('❌ [DEV DIAGNOSTICS] MongoDB Connection Failed');
      console.error(`🏷️  Error Category: [ ${category} ]`);
      console.error(`📛  Error Name:     ${error?.name || 'MongoError'}`);
      console.error(`🔢  Error Code:     ${error?.code || error?.codeName || 'N/A'}`);
      console.error(`💬  Safe Message:   ${safeMsg}`);
      console.error('======================================================\n');
    } else {
      // 2. Sanitized production logging
      console.error(`❌ MongoDB connection failed (${category}). Database features will run in offline simulation mode.`);
    }

    console.warn('⚠️ Continuing Express execution in offline verification mode.');
    return false;
  }
};

const getDbConnectionStatus = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

// Graceful server shutdown handling
process.on('SIGINT', async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('🔒 Mongoose database connection closed safely on server shutdown.');
  }
  process.exit(0);
});

module.exports = {
  connectDB,
  getDbConnectionStatus,
  sanitizeErrorMessage,
  categorizeMongoError
};
