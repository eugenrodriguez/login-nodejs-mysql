const express = require('express')
const router = express.Router()
const multer = require('multer');
const path = require('path');


const authController = require('../controllers/authController')
const conexion = require('../database/db')
const crud = require('../controllers/crud')



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Carpeta donde se guardarán los archivos
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nombre del archivo
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /mp3|mpeg/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Solo se permiten archivos de mp3 o mpeg!');
        }
    }
}).fields([{ name: 'song', maxCount: 1 }]);



router.get('/', authController.isAuthenticated, crud.getUserAlbums);

//ruta para crear albumes
router.get('/create', authController.isAuthenticated, (req, res) => {
    res.header('Cache-Control', 'no-store');
    res.render('create');
})


router.get('/edit/:id', authController.isAuthenticated, crud.editAlbum);
router.get('/delete/:id', authController.isAuthenticated, crud.deleteAlbum);
router.post('/save', authController.isAuthenticated, upload, crud.save);
router.post('/update', authController.isAuthenticated, upload, crud.update);
router.get('/album/:id', crud.getAlbumDetails);
router.post('/delete-song/:id', crud.deleteSong);
router.get('/album-songs/:id', crud.getAlbumSongs);


router.get('/login', (req, res) => {
    res.render('login', { alert: false })
})

router.get('/register', (req, res) => {
    res.render('register')
})

//router para los metodos del controlador de autenticacion
router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/logout', authController.logout)


module.exports = router



