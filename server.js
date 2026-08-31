const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const app = express();

const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
    try {
        const imagePath = path.join(__dirname, 'mapa_renderizado.png');
        let playersParam = req.query.players;

        if (!playersParam) {
            return res.sendFile(imagePath);
        }

        playersParam = decodeURIComponent(playersParam);
        const img = await loadImage(imagePath);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(img, 0, 0);

        const minX = -3712, maxX = 3712;
        const minZ = -4032, maxZ = 8064;

        const outerRadius = Math.max(15, Math.round(img.width * 0.015));
        const innerRadius = Math.max(8, Math.round(img.width * 0.009));

        const players = playersParam.split(';');
        players.forEach(p => {
            const coords = p.split(',').map(Number);
            if (coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                const x = coords[0];
                const z = coords[1];

                const relX = (x - minX) / (maxX - minX);
                const relZ = (z - minZ) / (maxZ - minZ);

                const px = relX * img.width;
                const pz = relZ * img.height;

                ctx.beginPath();
                ctx.arc(px, pz, outerRadius, 0, 2 * Math.PI);
                ctx.fillStyle = 'white';
                ctx.fill();
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'black';
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(px, pz, innerRadius, 0, 2 * Math.PI);
                ctx.fillStyle = 'red';
                ctx.fill();
            }
        });

        const buffer = canvas.toBuffer('image/png');
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.send(buffer);
        
    } catch (err) {
        // Agora o servidor não esconde mais o erro. Ele vai imprimir na tela o que deu errado.
        console.error('Erro:', err);
        res.status(500).send(`Erro interno ao renderizar mapa: ${err.message}`);
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
