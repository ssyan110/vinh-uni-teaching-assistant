/* slide-base.js — shared reveal logic for all lesson slides
 * Include in every slide: <script src="../assets/slide-base.js"></script>
 * Requires: lucide icons already loaded via CDN in <head>
 */
lucide.createIcons();
let revealIndex = 0;
function revealNext() {
  const stepped = Array.from(document.querySelectorAll('[data-reveal-step]')).sort((a,b)=>Number(a.dataset.revealStep)-Number(b.dataset.revealStep));
  if (stepped.length) {
    if (revealIndex < stepped.length) {
      stepped[revealIndex++].classList.add('revealed');
    } else {
      stepped.forEach(el => el.classList.remove('revealed'));
      revealIndex = 0;
    }
    return;
  }
  const all = document.querySelector('[data-reveal-all]');
  if (all) all.classList.toggle('revealed');
}
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'reveal-next') revealNext();
});
document.addEventListener('click', revealNext);
