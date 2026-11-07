document.getElementById('yr').textContent = new Date().getFullYear();
const c = document.getElementById('clock');
const tick = () => c.textContent = 'Bengaluru · ' + new Date().toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:false}) + ' IST';
tick(); setInterval(tick, 30000);
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold:.12});
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
