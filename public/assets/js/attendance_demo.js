(function(){
  const $ = (q)=>document.querySelector(q);
  const listWrap = $("#listWrap");
  const searchBox = $("#searchBox");
  const filterStatus = $("#filterStatus");
  const elPresent = $("#countPresent");
  const elTotal = $("#countTotal");
  if(!listWrap) return;

  // ====== Cấu hình ======
  const AUTO_ENROLL = true; // true: gặp ID mới -> tự thêm vào roster và cập nhật Total

  // ====== Roster khởi tạo (ví dụ) ======
  const roster = [
    {id:"23BI1001", name:"Nguyen Van A", email:"a23bi1001@usth.edu.vn"},
    {id:"23BI1002", name:"Tran Thi B",   email:"b23bi1002@usth.edu.vn"},
    {id:"23BI1003", name:"Le Van C",     email:"c23bi1003@usth.edu.vn"},
    {id:"23BI1004", name:"Pham Minh D",  email:"d23bi1004@usth.edu.vn"},
    {id:"23BI1005", name:"Hoang Gia E",  email:"e23bi1005@usth.edu.vn"},
    {id:"23BI1006", name:"Doan Thu F",   email:"f23bi1006@usth.edu.vn"},
    {id:"23BI1007", name:"Bui Huu G",    email:"g23bi1007@usth.edu.vn"},
    {id:"23BI1008", name:"Vu Thanh H",   email:"h23bi1008@usth.edu.vn"},
    {id:"23BI1009", name:"Ngo Tuan I",   email:"i23bi1009@usth.edu.vn"},
    {id:"23BI1010", name:"Phan Anh K",   email:"k23bi1010@usth.edu.vn"},
  ];

  // Dùng Map để tra nhanh và tránh trùng khóa
  const rosterMap = new Map(roster.map(s => [s.id, s]));
  const present = new Map(); // id -> {id,name,email,status,at,avatar}

  function updateTotals(){
    elTotal.textContent = rosterMap.size;
    elPresent.textContent = present.size;
  }

  function renderList(){
    const kw = (searchBox?.value || "").trim().toLowerCase();
    const statusFilter = filterStatus?.value || "all";
    listWrap.innerHTML = "";
    const items = Array.from(present.values()).sort((a,b)=>a.at - b.at);

    items.forEach(item=>{
      const matchesKw = !kw ||
        item.name.toLowerCase().includes(kw) ||
        item.id.toLowerCase().includes(kw) ||
        (item.email||"").toLowerCase().includes(kw);
      const matchesStatus = statusFilter==="all" || item.status===statusFilter;
      if(!matchesKw || !matchesStatus) return;

      const row = document.createElement("div");
      row.className="flex items-start gap-3 p-2 border rounded-xl bg-white/70";
      row.innerHTML = `
        <img src="${item.avatar || 'https://api.dicebear.com/9.x/thumbs/svg?seed='+encodeURIComponent(item.id)}"
             class="w-10 h-10 rounded-full border object-cover mt-0.5" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-3">
            <p class="font-medium truncate">${item.name}</p>
            <span class="text-xs text-slate-500">${new Date(item.at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</span>
          </div>
          <p class="text-xs text-slate-600 truncate">${item.id}</p>
          <p class="text-xs text-slate-500 truncate">${item.email || ""}</p>
        </div>
        <span class="${item.status==='late' ? 'chip chip-orange' : 'chip chip-green'}">
          ${item.status==='late' ? 'Late' : 'Present'}
        </span>
      `;
      listWrap.appendChild(row);
    });

    updateTotals();
  }

  function toast(msg){
    const t = document.querySelector("#toast");
    if(!t) return;
    t.textContent = msg;
    t.classList.remove("hidden");
    setTimeout(()=>t.classList.add("hidden"), 1400);
  }

  // ====== API FE để BE gọi khi nhận diện xong ======
  function pushPresence({id,name,avatar,email,status="present",at=Date.now()}){
    if (!id) return;

    // Nếu ID chưa có trong roster:
    if(!rosterMap.has(id)){
      if (AUTO_ENROLL){
        rosterMap.set(id, {id, name: name||id, email: email||""});
      } else {
        // Strict mode: bỏ qua và cảnh báo (không cho Present vượt Total)
        console.warn(`[Attendance] Unknown student ${id} — ignored (STRICT MODE)`);
        toast(`Unknown student ${id} (ignored)`);
        return;
      }
    }

    // Không cho trùng check-in
    if (present.has(id)) return;

    // Lấy info từ roster để điền thiếu name/email nếu BE không gửi
    const base = rosterMap.get(id);
    const item = {
      id,
      name: name || base.name,
      email: email || base.email,
      status,
      at,
      avatar
    };
    present.set(id, item);
    renderList();
    toast(`${item.name} checked in`);
  }

  // Expose
  window.Attendance = { pushPresence };

  searchBox?.addEventListener("input", renderList);
  filterStatus?.addEventListener("change", renderList);

  // ==== Demo queue (có thể xóa khi dùng thật) ====
  const demoQueue = [
    {id:"23BI14204", name:"Le Vinh Khai",   email:"KhaiLV.23bi14204@usth.edu.vn"},
    {id:"23BI10017", name:"Tran Trung Ran",  email:"RanTT.23BI10017@usth.edu.vn"},
     {id:"23BI10012", name:"Tran Thi Buoi", email:"BuoiTT.23BI10012@usth.edu.vn", status:"late"},
     {id:"23BI10019", name:"Ngo Ba Kha", email:"KhaNB.23BI10019@usth.edu.vn"},
    {id:"23BI10011", name:"Tang Nguyen Tien Dat", email:"DatTNT.23BI10011@usth.edu.vn"},
    {id:"23BI10020", name:"Pham Thanh Tung",    email:"TungPT.23BI10020@usth.edu.vn"},
    {id:"23BI10021", name:"Nguyen Thi Hoa",     email:"HoaNT.23BI10021@usth.edu.vn"},
    {id:"23BI10022", name:"Do Duc Manh",        email:"ManhDD.23BI10022@usth.edu.vn"},
    {id:"23BI10023", name:"Vu Minh Chau",       email:"ChauVM.23BI10023@usth.edu.vn", status:"late"},
    {id:"23BI10024", name:"Le Quang Huy",       email:"HuyLQ.23BI10024@usth.edu.vn"},
    {id:"23BI10025", name:"Hoang Phuong Linh",  email:"LinhHP.23BI10025@usth.edu.vn"},
    {id:"23BI10026", name:"Nguyen Van An",      email:"AnNV.23BI10026@usth.edu.vn"},
    {id:"23BI10027", name:"Tran Bao Ngoc",      email:"NgocTB.23BI10027@usth.edu.vn"},
    {id:"23BI10028", name:"Pham Duc Kien",      email:"KienPD.23BI10028@usth.edu.vn"},
    {id:"23BI10029", name:"Nguyen Hoai Nam",    email:"NamNH.23BI10029@usth.edu.vn"},
  ];

  let i=0;
  const timer = setInterval(()=>{
    if(i<demoQueue.length){
      pushPresence(demoQueue[i++]);
    } else {
      clearInterval(timer);
    }
  }, 1600);

  // init totals UI
  updateTotals();
})();
