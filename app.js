const express = require('express')
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')

const app = express()

const fs = require('fs');
const path = require('path');


const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir); // Crea la carpeta 'uploads' si no existe
}


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.set('view engine', 'ejs')


//seteo de carpeta public para archivos estaticos
app.use(express.static('public'))

//para procesar datos enviados desde forms
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

//seteo de variables de entorno
dotenv.config({ path: './env/.env' })

//para poder trabajar con las cookies
app.use(cookieParser())



//Llamar al router
app.use('/', require('./routes/router'))

app.use(function (req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});







app.set("port", 4000)
app.listen(app.get("port"))
console.log("Servidor corriendo en puerto", app.get("port"))