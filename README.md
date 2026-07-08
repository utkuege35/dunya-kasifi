# 🌍 Dünya Kâşifi — İngilizce Macera Oyunu

Top-down perspektif macera oyunu. Farklı ülkeleri keşfederek İngilizce öğren!

## Özellikler
- 5 ülke: Japonya, Brezilya, İtalya, Mısır, Avustralya
- Her ülkede 3 oda, her odada 5 soru
- Soru tipleri: kelime, boşluk doldurma, okuma, cümle kurma
- Top-down perspektif, joystick kontrolü
- Soru tekrarı yok (localStorage ile takip)
- XP ve yıldız sistemi

## Teknik Yapı
```
src/
  engine/     → Oyun motoru (game.js, world.js, player.js)
  screens/    → Ekranlar (splash, chars, map, game-screen)
  ui/         → UI bileşenleri (questions, roomdone)
  utils/      → Yardımcılar (state, tts, loader)
data/
  countries/  → Ülke verileri (index.json)
  questions/  → Soru bankası (ülke/oda.json)
  world-map.json
```

## Yeni Ülke Eklemek
1. `data/countries/index.json`'a ülkeyi ekle
2. `data/questions/ulke-id/` klasörü oluştur
3. Her oda için `oda-id.json` dosyası ekle
4. Push et — bitti!

## Geliştirme
```bash
# Yerel sunucu başlat (ES Modules için gerekli)
npx serve .
# veya
python3 -m http.server 8080
```
