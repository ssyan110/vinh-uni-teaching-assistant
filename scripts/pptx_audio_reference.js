'use strict';

function addAudioReference(slide, track) {
  if (!/^\d+-\d+$/.test(String(track))) throw new Error(`Invalid source audio track: ${track}`);
  slide.addText(`Audio ${track}`, {
    x: 10.42, y: 0.96, w: 2.2, h: 0.62,
    fontFace: 'Times New Roman', fontSize: 20, color: '17324D',
    align: 'right', margin: 0, breakLine: false
  });
}

function requestedMode(args, env = {}) {
  const index = args.indexOf('--mode');
  const mode = index < 0 ? 'online' : args[index + 1];
  if (!['online', 'legacy-face'].includes(mode)) throw new Error('--mode must be online or legacy-face');
  if (env.BOYA_FACE_ONLY === '1' && mode !== 'legacy-face') throw new Error('Use explicit --mode legacy-face for historical PPTX maintenance');
  if (env.BOYA_ONLINE_ONLY === '1' && mode !== 'online') throw new Error('Conflicting online-only environment and legacy-face mode');
  return mode;
}

module.exports = { addAudioReference, requestedMode };
