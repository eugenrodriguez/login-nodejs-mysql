const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')
const conexion = require('../database/db')
const { promisify } = require('util')

//metodo para registrarnos
exports.register = async (req, res) => {

    try {
        const name = req.body.name;
        const user = req.body.user;
        const email = req.body.email;
        const password = req.body.password;

        let passwordHash = await bcryptjs.hash(password, 8);

        if (!user || !name || !email || !password) {
            res.render('register', {
                alert: true,
                alertTitle: "Advertencia",
                alertMessage: "Complete los campos requeridos",
                alertIcon: 'error',
                showConfirmButton: true,
                timer: false,
                ruta: 'register'
            });
        } else {
            conexion.query('INSERT INTO users SET ?', { user: user, name: name, email: email, password: passwordHash }, (error, results) => {
                if (error) {
                    // Manejar error de duplicado
                    if (error.code === 'ER_DUP_ENTRY') {
                        res.render('register', {
                            alert: true,
                            alertTitle: "Error",
                            alertMessage: "El nombre de usuario ingresado ya está en uso",
                            alertIcon: 'error',
                            showConfirmButton: true,
                            timer: false,
                            ruta: 'register'
                        });
                    } else {
                        console.log(error);
                    }
                } else {
                    res.redirect('/');
                }
            });
        }
    } catch (error) {
        console.log(error);
    }

};

exports.login = async (req, res) => {
    try {
        const user = req.body.user;
        const password = req.body.password;

        if (!user || !password) {
            res.render('login', {
                alert: true,
                alertTitle: "Advertencia",
                alertMessage: "Ingrese usuario y contraseña para ingresar",
                alertIcon: 'info',
                showConfirmButton: true,
                timer: false,
                ruta: 'login'
            });
        } else {
            conexion.query('SELECT * FROM users WHERE user = ?', [user], async (error, results) => {
                if (results.length == 0 || !(await bcryptjs.compare(password, results[0].password))) {
                    res.render('login', {
                        alert: true,
                        alertTitle: "Error",
                        alertMessage: "Usuario o contraseña incorrectos",
                        alertIcon: 'error',
                        showConfirmButton: true,
                        timer: false,
                        ruta: 'login'
                    });
                } else {
                    const id = results[0].id;
                    const token = jwt.sign({ id: id }, process.env.JWT_SECRETO, {
                        expiresIn: process.env.JWT_TIEMPO_EXPIRA
                    });

                    console.log("TOKEN: " + token + " para el USUARIO : " + user);

                    const cookiesOptions = {
                        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
                        httpOnly: true
                    };
                    res.cookie('jwt', token, cookiesOptions);
                    res.render('login', {
                        alert: true,
                        alertTitle: "Conexión exitosa",
                        alertMessage: "¡LOGIN CORRECTO!",
                        alertIcon: 'success',
                        showConfirmButton: false,
                        timer: 800,
                        ruta: ''
                    });
                }
            });
        }
    } catch (error) {
        console.log(error);
    }
};

exports.isAuthenticated = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            const decodificada = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRETO)
            conexion.query('SELECT * FROM users WHERE id = ?', [decodificada.id], (error, results) => {
                if (!results) {
                    return next()
                }
                req.user = results[0]
                return next()
            })
        } catch (error) {
            console.log(error)
            return next()
        }
    } else {
        res.redirect('/login')
    }
}

exports.logout = (req, res) => {
    res.clearCookie('jwt')
    return res.redirect('/')
}