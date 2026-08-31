const express = require('express');
const path = require('path');
const app = express();

const port = process.env.PORT || 3000;

// Rota principal: Serve a imagem diretamente
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'mapa_renderizado.png'));
});

// Rota extra (/ver): Exibe o mapa em uma página web mais bonita
app.get('/ver', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Mapa do Servidor</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { background-color: #222; color: white; text-align: center; font-family: sans-serif; }
                    img { max-width: 100%; height: auto; border: 2px solid #555; border-radius: 8px; }
                </style>
            </head>
            <body>
                <h2>🌍 Mapa do Servidor</h2>
                <img src="/" alt="Mapa Renderizado" />
            </body>
        </html>
    `);
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
