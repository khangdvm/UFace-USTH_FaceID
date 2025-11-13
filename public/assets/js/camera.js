(function(){
  const $ = (q)=>document.querySelector(q);

  let stream = null;
  let facing = "user"; // or "environment"

  function setBadge(text, variant){
    const el = $("#camStatus"); if(!el) return;
    const map = {
      ok: "badge bg-green-100 text-green-700",
      off: "badge bg-amber-100 text-amber-700",
      err: "badge bg-red-100 text-red-700",
    };
    el.textContent = text;
    el.className = map[variant] || map.off;
  }
  function showToast(msg){
    const el = $("#toast"); if(!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    setTimeout(()=>el.classList.add("hidden"), 1500);
  }

  async function openCam(){
    if(stream) return;
    try{
      stream = await navigator.mediaDevices.getUserMedia({
        video:{facingMode:facing, width:{ideal:1280}, height:{ideal:720}},
        audio:false
      });
      const video = $("#video");
      if(video) video.srcObject = stream;
      setBadge("Camera's on", "ok");
      $("#btnSwitchCam")?.classList.remove("hidden");
      $("#btnStopCam")?.classList.remove("hidden");
      showToast("Camera started");
    }catch(e){
      console.error(e);
      setBadge("Camera error", "err");
      showToast("Failed to open camera. Use HTTPS/localhost & allow permission.");
    }
  }

  function stopCam(){
    if(!stream) return;
    stream.getTracks().forEach(t=>t.stop());
    stream = null;
    const video = $("#video"); if(video) video.srcObject = null;
    setBadge("Camera's off", "off");
    $("#btnSwitchCam")?.classList.add("hidden");
    $("#btnStopCam")?.classList.add("hidden");
    showToast("Camera stopped");
  }

  async function switchCam(){
    facing = (facing==="user") ? "environment" : "user";
    if(stream) stopCam();
    await openCam();
  }

  function initButtons(){
    $("#btnOpenCam")?.addEventListener("click", openCam);
    $("#btnStopCam")?.addEventListener("click", stopCam);
    $("#btnSwitchCam")?.addEventListener("click", switchCam);
  }

  // Clock helper (nếu có #clock)
  function startClock(){
    const clock = $("#clock"); if(!clock) return;
    const tick = ()=> clock.textContent = new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
    tick(); setInterval(tick, 1000);
  }

  // Expose
  window.CameraCtrl = { openCam, stopCam, switchCam };

  // Auto init if elements exist
  document.addEventListener("DOMContentLoaded", ()=>{
    initButtons();
    startClock();
  });
})();
