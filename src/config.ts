import 'dotenv/config'

export const mysqlSynology = {
  host: process.env.MARIADB_HOST,
  user: process.env.MARIADB_USER,
  password: process.env.MARIADB_PASSWORD,
  port: process.env.MARIADB_PORT,
  database: process.env.MARIADB_DATABASE,
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
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE,
  requireTLC: process.env.SMTP_REQUIRE_TLC,
  auth: {
    user: process.env.SMTP_AUTH_USER,
    pass: process.env.SMTP_AUTH_PASS, // Generata andando a creare una nuova password per applicazioni di terze parti nell'account google dell'utente
  }
}

console.log(mysqlSynology);
console.log(smpt);