const express = require('express');
const Jimp = require('jimp');
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
        const image = await Jimp.read(imagePath);

        const width = image.bitmap.width;
        const height = image.bitmap.height;

        // Limites do mapa no Minecraft
        const minX = -3712, maxX = 3712;
        const minZ = -4032, maxZ = 8064;

        // Raio dinâmico para a marcação
        const radius = Math.max(14, Math.round(width * 0.015));

        // Aceita separadores ; ou |
        const players = playersParam.split(/[;|]/);

        players.forEach(p => {
            const coords = p.split(',').map(Number);
            if (coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                const x = coords[0];
                const z = coords[1];

                const relX = (x - minX) / (maxX - minX);
                const relZ = (z - minZ) / (maxZ - minZ);

                const px = Math.round(relX * width);
                const pz = Math.round(relZ * height);

                // Desenha o círculo (borda branca e centro vermelho)
                for (let dx = -radius; dx <= radius; dx++) {
                    for (let dz = -radius; dz <= radius; dz++) {
                        const distSq = dx * dx + dz * dz;
                        const targetX = px + dx;
                        const targetY = pz + dz;

                        if (targetX >= 0 && targetX < width && targetY >= 0 && targetY < height) {
                            if (distSq <= radius * radius) {
                                if (distSq <= (radius * 0.55) * (radius * 0.55)) {
                                    // Ponto interno Vermelho
                                    image.setPixelColor(Jimp.rgbaToInt(255, 0, 0, 255), targetX, targetY);
                                } else {
                                    // Borda externa Branca
                                    image.setPixelColor(Jimp.rgbaToInt(255, 255, 255, 255), targetX, targetY);
                                }
                            }
                        }
                    }
                }
            }
        });

        const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.send(buffer);

    } catch (err) {
        console.error('Erro ao processar imagem:', err);
        res.sendFile(path.join(__dirname, 'mapa_renderizado.png'));
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
