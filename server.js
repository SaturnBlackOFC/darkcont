const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const app = express();

const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
    try {
        const imagePath = path.join(__dirname, 'mapa_renderizado.png');
        let playersParam = req.query.players;

        // Se não houver jogadores na query, envia a imagem limpa
        if (!playersParam) {
            return res.sendFile(imagePath);
        }

        // Trata caracteres especiais de URL (como o caractere '|')
        playersParam = decodeURIComponent(playersParam);

        const img = await loadImage(imagePath);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');

        // Desenha o mapa de fundo
        ctx.drawImage(img, 0, 0);

        // Limites do mapa no Minecraft
        const minX = -3712, maxX = 3712;
        const minZ = -4032, maxZ = 8064;

        // Calcula um raio proporcional à resolução da imagem para a bola não sumir no Discord
        const outerRadius = Math.max(30, Math.round(img.width * 0.015));
        const innerRadius = Math.max(18, Math.round(img.width * 0.009));

        const players = playersParam.split('|');
        players.forEach(p => {
            const coords = p.split(',').map(Number);
            if (coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                const x = coords[0];
                const z = coords[1];

                const relX = (x - minX) / (maxX - minX);
                const relZ = (z - minZ) / (maxZ - minZ);

                const px = relX * img.width;
                const pz = relZ * img.height;

                // Círculo Externo (Branco com borda preta)
                ctx.beginPath();
                ctx.arc(px, pz, outerRadius, 0, 2 * Math.PI);
                ctx.fillStyle = 'white';
                ctx.fill();
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'black';
                ctx.stroke();

                // Círculo Interno (Vermelho)
                ctx.beginPath();
                ctx.arc(px, pz, innerRadius, 0, 2 * Math.PI);
                ctx.fillStyle = 'red';
                ctx.fill();
            }
        });

        // Envia como Buffer binário direto para evitar quebra de stream no Express
        const buffer = canvas.toBuffer('image/png');
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.send(buffer);
    } catch (err) {
        console.error('Erro na renderização do mapa:', err);
        res.sendFile(path.join(__dirname, 'mapa_renderizado.png'));
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
