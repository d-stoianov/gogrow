import * as dotenv from 'dotenv'

dotenv.config()

const PORT = parseInt(process.env.PORT ?? '8080')

export { PORT }
