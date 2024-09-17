const express = require('express')
const router = express.Router()

const authController = require('../controllers/authController')
const conexion = require('../database/db')


//router para las vistas
router.get('/', authController.isAuthenticated, (req, res) => {
    const userId = req.user.id;

    // Modificar la consulta para que solo obtenga los álbumes del usuario autenticado
    conexion.query('SELECT * FROM albums WHERE user_id = ?', [userId], (error, results) => {
        if (error) {
            throw error;
        } else {
            res.render('index', { results: results });
        }
    });
});

router.get('/create', (req, res) => {
    res.render('create');
})

const crud = require('../controllers/crud')
router.post('/save', crud.save)

router.get('/login', (req, res) => {
    res.render('login', { alert: false })
})

router.get('/register', (req, res) => {
    res.render('register')
})

//router para los metodos del controller
router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/save', authController.isAuthenticated, crud.save);
router.get('/logout', authController.logout)


module.exports = router