const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const app = express();

const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
    try {
        const imagePath = path.join(__dirname, 'mapa_renderizado.png');
        const playersParam = req.query.players;

        // Se não houver jogadores na query, envia a imagem limpa
        if (!playersParam) {
            return res.sendFile(imagePath);
        }

        const img = await loadImage(imagePath);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');

        // Desenha a imagem de fundo
        ctx.drawImage(img, 0, 0);

        // Coordenadas dos limites do mapa
        const minX = -3712, maxX = 3712;
        const minZ = -4032, maxZ = 8064;

        // Desenha cada jogador enviado na URL (formato: X,Z|X,Z)
        const players = playersParam.split('|');
        players.forEach(p => {
            const [x, z] = p.split(',').map(Number);
            if (!isNaN(x) && !isNaN(z)) {
                const relX = (x - minX) / (maxX - minX);
                const relZ = (z - minZ) / (maxZ - minZ);

                const px = relX * img.width;
                const pz = relZ * img.height;

                // Círculo externo (Branco)
                ctx.beginPath();
                ctx.arc(px, pz, 12, 0, 2 * Math.PI);
                ctx.fillStyle = 'white';
                ctx.fill();

                // Círculo interno (Vermelho)
                ctx.beginPath();
                ctx.arc(px, pz, 8, 0, 2 * Math.PI);
                ctx.fillStyle = 'red';
                ctx.fill();
            }
        });

        res.setHeader('Content-Type', 'image/png');
        canvas.createPNGStream().pipe(res);
    } catch (err) {
        console.error(err);
        res.sendFile(path.join(__dirname, 'mapa_renderizado.png'));
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
