function a(){
let d=document.getElementById('d').value/1000;
let res=Math.PI*(d/2)*(d/2);
document.getElementById('out').innerText=res.toFixed(3)+' m2';
}
function b(){
let p=document.getElementById('p').value*9.81;
document.getElementById('out2').innerText=p.toFixed(1)+' Pa';
}
if('serviceWorker' in navigator){navigator.serviceWorker.register('service-worker.js');}