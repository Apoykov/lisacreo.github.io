#!/bin/bash
cd ~/Obsidian/LisaCreo/lisacreo.github.io
cp -r ../lisa_creo/. .
git add .
git commit -m "обновление сайта"
git push
echo "✅ Сайт обновлён!"
