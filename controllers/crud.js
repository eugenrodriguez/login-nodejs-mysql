const jwt = require('jsonwebtoken');
const conexion = require('../database/db');



// Función para guardar un nuevo álbum
exports.save = (req, res) => {
    try {
        // Verifica si el token JWT está presente en las cookies
        const token = req.cookies.jwt;

        if (!token) {
            return res.status(401).send('Acceso denegado. No se proporcionó el token');
        }

        // Decodifica el token para obtener el id del usuario
        const decoded = jwt.verify(token, process.env.JWT_SECRETO);
        const user_id = decoded.id; // Aquí obtenemos el ID del usuario autenticado

        // Datos del cuerpo de la solicitud
        const title = req.body.title;
        const autor = req.body.autor;
        const genre = req.body.genre;
        const release_date = new Date();

        // Inserta un nuevo álbum en la base de datos con el ID del usuario
        conexion.query(
            'INSERT INTO albums SET ?',
            { title: title, autor: autor, genre: genre, release_date: release_date, user_id: user_id },
            (error, results) => {
                if (error) {
                    console.log('Error al crear el álbum:', error);
                    return res.redirect('/create');
                } else {
                    res.redirect('/');
                }
            }
        );
    } catch (error) {
        console.error('Error al procesar el token:', error);
        return res.status(401).send('Token inválido');
    }
};


/*exports.save = (req, res) => {
    const title = req.body.title;
    const autor = req.body.autor;
    const genre = req.body.genre;
    const currentDate = new Date();

    conexion.query(
        'INSERT INTO albums SET ?',
        { title: title, autor: autor, genre: genre, release_date: currentDate, user_id },
        (error, results) => {
            if (error) {
                console.log(error);
                res.redirect('/create');
            } else {
                res.redirect('/');
            }
        }
    );
};*/