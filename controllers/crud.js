const jwt = require('jsonwebtoken');
const conexion = require('../database/db');
const path = require('path');


exports.save = (req, res) => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            return res.status(401).send('Acceso denegado. No se proporcionó el token');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRETO);
        const user_id = decoded.id;

        const title = req.body.title;
        const autor = req.body.autor;
        const genre = req.body.genre;
        const release_date = new Date();
        const songFile = req.files.song ? req.files.song[0] : null; // Asegúrate de acceder correctamente al archivo


        conexion.query(
            'INSERT INTO albums SET ?',
            { title: title, autor: autor, genre: genre, release_date: release_date, user_id: user_id },
            (error, results) => {
                if (error) {
                    console.log('Error al crear el álbum:', error);
                    return res.redirect('/create');
                } else {
                    const albumId = results.insertId;

                    // Verifica si se subió un archivo de canción
                    if (songFile) {
                        const songPath = path.join('uploads', songFile.filename);
                        console.log('Guardando canción en:', songPath); // Verifica la ruta

                        // Asegúrate de que el directorio existe antes de insertar en la base de datos
                        conexion.query(
                            'INSERT INTO songs (name, file_path, album_id) VALUES (?, ?, ?)',
                            [songFile.originalname, songPath, albumId],
                            (err) => {
                                if (err) {
                                    console.log('Error al guardar la canción:', err);
                                } else {
                                    console.log('Canción guardada en la base de datos.');
                                }
                            }
                        );
                    } else {
                        console.log('No se subió ningún archivo de canción.');
                    }

                    res.redirect('/');
                }
            }
        );
    } catch (error) {
        console.error('Error al procesar el token:', error);
        return res.status(401).send('Token inválido');
    }
};

// Función para guardar un nuevo álbum
/*exports.save = (req, res) => {
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
        const songFile = req.file;

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
};*/

exports.update = (req, res) => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            return res.status(401).send('Acceso denegado. No se proporcionó el token');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRETO);
        const user_id = decoded.id;

        const id = req.body.id;
        const title = req.body.title;
        const autor = req.body.autor;
        const genre = req.body.genre;
        const songFile = req.files.song ? req.files.song[0] : null; // Asegúrate de acceder correctamente al archivo

        // Actualiza el álbum
        conexion.query('UPDATE albums SET ? WHERE id = ?', [{ title: title, autor: autor, genre: genre }, id], (error) => {
            if (error) {
                console.log('Error al actualizar el álbum:', error);
                return res.redirect('/edit/' + id); // Redirigir para mostrar errores
            }

            // Si se subió un nuevo archivo de canción, se guarda en la base de datos
            if (songFile) {
                const songPath = path.join('uploads', songFile.filename);
                conexion.query(
                    'INSERT INTO songs (name, file_path, album_id) VALUES (?, ?, ?)',
                    [songFile.originalname, songPath, id],
                    (err) => {
                        if (err) {
                            console.log('Error al guardar la nueva canción:', err);
                        }
                    }
                );
            }

            res.redirect('/');
        });
    } catch (error) {
        console.error('Error al procesar el token:', error);
        return res.status(401).send('Token inválido');
    }
};

exports.deleteAlbum = (req, res) => {
    const id = req.params.id;
    conexion.query('DELETE FROM albums WHERE id = ?', [id], (error, results) => {
        if (error) {
            throw error;
        } else {
            res.redirect('/');
        }
    })
}

exports.editAlbum = (req, res) => {
    const id = req.params.id;

    // Primero, obtén el álbum
    conexion.query('SELECT * FROM albums WHERE id = ?', [id], (error, albumResults) => {
        if (error) {
            throw error;
        }

        // Asegúrate de que el álbum existe
        if (albumResults.length === 0) {
            return res.status(404).send('Álbum no encontrado.');
        }

        const album = albumResults[0];

        // Ahora, obtén las canciones asociadas a este álbum
        conexion.query('SELECT * FROM songs WHERE album_id = ?', [album.id], (err, songResults) => {
            if (err) {
                throw err;
            }

            // Agregar las canciones al álbum
            album.songs = songResults;

            res.header('Cache-Control', 'no-store');
            res.render('edit', { album: album });
        });
    });
};

exports.getAlbumDetails = (req, res) => {
    const albumId = req.params.id; // Obtener el ID del álbum desde la URL

    // Obtener el álbum y sus canciones
    conexion.query('SELECT * FROM albums WHERE id = ?', [albumId], (error, albumResults) => {
        if (error) {
            console.log('Error al obtener el álbum:', error);
            return res.status(500).send('Error al obtener el álbum');
        }

        // Asegúrate de que el álbum existe
        if (albumResults.length === 0) {
            return res.status(404).send('Álbum no encontrado');
        }

        const album = albumResults[0];

        // Obtener las canciones asociadas a este álbum
        conexion.query('SELECT * FROM songs WHERE album_id = ?', [albumId], (err, songResults) => {
            if (err) {
                console.log('Error al obtener las canciones:', err);
                return res.status(500).send('Error al obtener las canciones');
            }

            // Renderiza la vista de detalles del álbum
            res.render('album-detail', { album: album, songs: songResults });
        });
    });
};

exports.getUserAlbums = (req, res) => {
    const userId = req.user.id; // ID del usuario autenticado
    conexion.query('SELECT * FROM albums WHERE user_id = ?', [userId], (error, results) => {
        if (error) {
            console.log('Error al obtener los álbumes:', error);
            return res.status(500).send('Error al obtener los álbumes');
        } else {
            res.header('Cache-Control', 'no-store');
            res.render('index', { results: results });
        }
    });
};


// Función para eliminar una canción
exports.deleteSong = (req, res) => {
    const songId = req.params.id; // Obtener el ID de la canción desde la URL

    // Eliminar la canción de la base de datos
    conexion.query('DELETE FROM songs WHERE id = ?', [songId], (error, results) => {
        if (error) {
            console.log('Error al eliminar la canción:', error);
            return res.status(500).send('Error al eliminar la canción');
        }
        res.location(req.get("Referrer") || "/") // Redirigir a la página anterior
    });
};

// Función para listar las canciones de un álbum
exports.getAlbumSongs = (req, res) => {
    const albumId = req.params.id; // Obtener el ID del álbum desde la URL

    // Obtener las canciones del álbum
    conexion.query('SELECT * FROM songs WHERE album_id = ?', [albumId], (error, results) => {
        if (error) {
            console.log('Error al obtener las canciones del álbum:', error);
            return res.status(500).send('Error al obtener las canciones');
        }
        res.json(results); // Enviar las canciones como respuesta (puedes cambiar esto según tus necesidades)
    });
};

// Función para obtener los detalles de un álbum


/*exports.update = (req, res) => {
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
        const id = req.body.id;
        const title = req.body.title;
        const autor = req.body.autor;
        const genre = req.body.genre;
        const release_date = new Date();

        conexion.query('UPDATE albums SET ? WHERE id = ?', [{ title: title, autor: autor, genre: genre }, id], (error, results) => {
            if (error) {
                console.log(error);
            } else {
                res.redirect('/');
            }
        })

        // Inserta un nuevo álbum en la base de datos con el ID del usuario
    } catch (error) {
        console.error('Error al procesar el token:', error);
        return res.status(401).send('Token inválido');
    }

}*/




