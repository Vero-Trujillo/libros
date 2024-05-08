// Paquetes
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const axios = require('axios');
const mysql = require('mysql');
const methodOverride = require('method-override');

app.use(bodyParser.urlencoded({ extended: true }))
app.set('view engine', 'ejs');
app.use('/public', express.static(__dirname + '/public'));

// Vinculación con la base de datos
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'libros'
});

// Vinculación y configuración de la tabla
connection.connect((error) => {
    if (error) throw error;
    console.log("Conexión exitosa")
    const crearTabla = `CREATE TABLE IF NOT EXISTS favoritos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        google_books_id VARCHAR(12) NOT NULL,
        title VARCHAR(100) NOT NULL,
        authors VARCHAR(100) NOT NULL,
        publishedDate DATE NOT NULL,
        categories VARCHAR(100) NOT NULL
    )`
    connection.query(crearTabla, (error, res) => {
        if (error) throw error;
        console.log("Tabla creada o ya existente");
    })
});

// Configuración del middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Ruta GET para recomendados.ejs
app.get('/', async (req, res) => {
    const api = await axios.get('https://www.googleapis.com/books/v1/volumes?q=publishedDate:2024');
    const libros = api.data.items;
    res.render('page/recomendados', { libros });
});

// Ruta GET de búsqueda de libros por título
app.get('/buscadorTitulo', async (req, res) => {
    const busquedaTitulo = req.query.busquedaTitulo;
    if (!busquedaTitulo) {
        return res.render('page/error', { mensaje: 'Ingrese un término de búsqueda' });
    }
    const respuesta = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=intitle:${busquedaTitulo}`);
    const libros = respuesta.data.items;
    res.render('page/buscadorTitulo', { busquedaTitulo, libros });
});

// Ruta GET de búsqueda de libros por género
app.get('/buscadorGenero', async (req, res) => {
    const busquedaGenero = req.query.busquedaGenero;
    if (!busquedaGenero) {
        return res.render('page/error', { mensaje: 'Ingrese un término de búsqueda' });
    }
    const respuesta = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=incategories:${busquedaGenero}`);
    const libros = respuesta.data.items;
    res.render('page/buscadorGenero', { busquedaGenero, libros });
});

// Ruta GET de búsqueda de libros por autor
app.get('/buscadorAutor', async (req, res) => {
    const busquedaAutor = req.query.busquedaAutor;
    if (!busquedaAutor) {
        return res.render('page/error', { mensaje: 'Ingrese un término de búsqueda' });
    }
    const respuesta = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=incategories:${busquedaAutor}`);
    const libros = respuesta.data.items;
    res.render('page/buscadorAutor', { busquedaAutor, libros });
});

// Ruta GET para ver detalles de un libro
app.get('/detalles', async (req, res) => {
    const libroId = req.query.id;
    const respuesta = await axios.get(`https://www.googleapis.com/books/v1/volumes/${libroId}`);
    const detalles = respuesta.data;
    res.render('page/detalles', { detalles });
});

// Ruta GET para favoritos
app.get('/favoritos', (req, res) => {
    connection.query('SELECT * FROM favoritos', (error, results) => {
        if (error) throw error;
        const favoritos = results;
        res.render('page/favoritos', { favoritos });
    });
});

// Ruta POST para ver detalles de un libro
app.post('/detalles', async (req, res) => {
    const libroId = req.body.id;
    const respuesta = await axios.get(`https://www.googleapis.com/books/v1/volumes/${libroId}`);
    const detalles = respuesta.data;
    res.render('page/detalles', { detalles });
});

// Ruta POST para agregar un libro a favoritos
app.post('/favoritos', (req, res) => {
    let google_books_id = req.body.google_books_id;
    let title = req.body.title;
    let authors = req.body.authors;
    let publishedDate = req.body.publishedDate;
    let categories = req.body.categories;

    connection.query(`INSERT INTO favoritos (google_books_id, title, authors, publishedDate, categories) VALUES (?, ?, ?, ?, ?)`, [google_books_id, title, authors, publishedDate, categories],
        function (error, result) {
            if (error) throw error;
            res.redirect('/favoritos');
        })
});

// Ruta DELETE para eliminar un libro de favoritos
app.delete('/favoritos/:id', (req, res) => {
    const id = req.params.id;
    connection.query('DELETE FROM favoritos WHERE id = ?', [id], (error, result) => {
        res.redirect('/favoritos');
    });
});

// Levantar el servidor 
app.listen(3072, () => {
    console.log('Servidor corriendo')
});




