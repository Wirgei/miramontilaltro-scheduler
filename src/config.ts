import fs from 'fs';
import path from 'path';

// Function to read and parse the configuration file
function loadConfig(filePath: string) {
  const config = fs.readFileSync(filePath, 'utf-8');
  const envVariables = config.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) {
      acc[key.trim()] = value.trim().replace(/^['"]|['"]$/g, ''); // Remove surrounding quotes
    }
    return acc;
  }, {} as Record<string, string>);
  return envVariables;
}

// Load environment variables from the configuration file
const env = loadConfig(path.resolve(__dirname, '../.env'));

export const mysqlSynology = {
  host: env.MARIADB_HOST,
  user: env.MARIADB_USER,
  password: env.MARIADB_PASSWORD,
  port: parseInt(env.MARIADB_PORT ?? ''),
  database: env.MARIADB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  typeCast: (field: any, useDefaultTypeCasting: any) => {
    if ((field.type === 'BIT') && (field.length === 1)) {

      let bytes = field.buffer();
      return (bytes[0] === 1);
    }
    return (useDefaultTypeCasting());
  }
};

export const smpt =
{
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT ?? ''),
  secure: env.SMTP_SECURE === 'true',
  requireTLC: env.SMTP_REQUIRE_TLC === 'true',
  auth: {
    user: env.SMTP_AUTH_USER,
    pass: env.SMTP_AUTH_PASS, // Generata andando a creare una nuova password per applicazioni di terze parti nell'account google dell'utente
  }
}

console.log({mysqlSynology, smpt});