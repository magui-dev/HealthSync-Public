// src/pages/PlanReport/MySlots.jsx
import { useState } from "react";

const box = {
  background:"#ffffff", border:"1px solid #e5e7eb",
  borderRadius:12, padding:12, boxShadow:"0 1px 2px rgba(0,0,0,0.03)"
};

const slotWrap = { display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:12 };
const label = { fontSize:12, opacity:.8, marginBottom:6 };

const btn = {
  padding:"6px 10px", borderRadius:8, border:"1px solid #e5e7eb",
  background:"#f9fafb", cursor:"pointer"
};

function SlotCard({ title, slot, onMinus, onPlus, onClear }) {
  const fmt = (n,d=0)=>Number(n).toLocaleString(undefined,{maximumFractionDigits:d});
  let view = null;

  if (slot) {
    const f = slot.grams / 100;
    const carb = +(slot.per100.carb * f).toFixed(1);
    const prot = +(slot.per100.protein * f).toFixed(1);
    const fat  = +(slot.per100.fat * f).toFixed(1);
    const kcal = Math.round(carb*4 + prot*4 + fat*9);

    view = (
      <>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <img src={slot.iconUrl} alt={slot.name} style={{ width:36, height:36, objectFit:"contain" }}/>
          <div style={{ fontWeight:600 }}>{slot.name}</div>
        </div>
        <div style={{ fontSize:12, opacity:.85, marginTop:6 }}>
          {slot.grams} g · 탄 {fmt(carb,1)} g · 단 {fmt(prot,1)} g · 지 {fmt(fat,1)} g · {kcal} kcal
        </div>
        <div style={{ display:"flex", gap:6, marginTop:8 }}>
          <button style={btn} onClick={onMinus}>-10g</button>
          <button style={btn} onClick={onPlus}>+10g</button>
          <button style={{...btn, background:"#fee2e2", border:"1px solid #fecaca"}} onClick={onClear}>삭제</button>
        </div>
      </>
    );
  } else {
    view = <div style={{ fontSize:12, opacity:.6 }}>왼쪽 프리셋에서 ‘담기’ 버튼을 눌러 담아보세요.</div>;
  }

  return (
    <div style={box}>
      <div style={{ fontWeight:700, marginBottom:8 }}>{title}</div>
      {view}
    </div>
  );
}

export default function MySlots({
  slots,                // { carb, protein, fat, custom }
  setSlot,              // (macro, slotObj|null) => void
  onSave,               // () => void
}) {
  // 커스텀 입력 상태
  const [custom, setCustom] = useState({
    name:"커스텀 식품",
    per100:{ carb:0, protein:0, fat:0, kcal:0 },
    grams:100,
  });

  const addCustom = () => {
    setSlot("custom", {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      macro: "CUSTOM",
      name: custom.name || "커스텀 식품",
      iconUrl: "/icons/custom.png",
      grams: Math.max(0, Number(custom.grams)||0),
      per100: {
        carb: Number(custom.per100.carb)||0,
        protein: Number(custom.per100.protein)||0,
        fat: Number(custom.per100.fat)||0,
        kcal: Number(custom.per100.kcal)||0,
      }
    });
  };

  const changeGram = (macro, diff) => {
    const s = slots[macro];
    if (!s) return;
    const next = Math.max(0, (s.grams||0) + diff);
    setSlot(macro, { ...s, grams: next });
  };

  return (
    <div style={{ display:"grid", gap:12 }}>
      <div style={slotWrap}>
        <SlotCard
          title="탄수화물"
          slot={slots.carb}
          onMinus={() => changeGram("carb",-10)}
          onPlus={() => changeGram("carb",+10)}
          onClear={() => setSlot("carb", null)}
        />
        <SlotCard
          title="단백질"
          slot={slots.protein}
          onMinus={() => changeGram("protein",-10)}
          onPlus={() => changeGram("protein",+10)}
          onClear={() => setSlot("protein", null)}
        />
        <SlotCard
          title="지방"
          slot={slots.fat}
          onMinus={() => changeGram("fat",-10)}
          onPlus={() => changeGram("fat",+10)}
          onClear={() => setSlot("fat", null)}
        />
        <div style={box}>
          <div style={{ fontWeight:700, marginBottom:8 }}>커스텀</div>
          {slots.custom ? (
            <SlotCard
              title=""
              slot={slots.custom}
              onMinus={() => changeGram("custom",-10)}
              onPlus={() => changeGram("custom",+10)}
              onClear={() => setSlot("custom", null)}
            />
          ) : (
            <>
              <div style={label}>이름</div>
              <input
                value={custom.name}
                onChange={(e)=>setCustom(v=>({...v, name:e.target.value}))}
                style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #e5e7eb", marginBottom:8 }}
              />
              <div style={label}>100 g 당 영양</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:6 }}>
                <input placeholder="탄 g" value={custom.per100.carb}
                  onChange={e=>setCustom(v=>({...v, per100:{...v.per100, carb:e.target.value}}))}
                  style={inp}/>
                <input placeholder="단 g" value={custom.per100.protein}
                  onChange={e=>setCustom(v=>({...v, per100:{...v.per100, protein:e.target.value}}))}
                  style={inp}/>
                <input placeholder="지 g" value={custom.per100.fat}
                  onChange={e=>setCustom(v=>({...v, per100:{...v.per100, fat:e.target.value}}))}
                  style={inp}/>
                <input placeholder="kcal" value={custom.per100.kcal}
                  onChange={e=>setCustom(v=>({...v, per100:{...v.per100, kcal:e.target.value}}))}
                  style={inp}/>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:8 }}>
                <div style={label}>그램</div>
                <input
                  value={custom.grams}
                  onChange={(e)=>setCustom(v=>({...v, grams:e.target.value.replace(/[^\d]/g,"")}))}
                  style={{ ...inp, width:100 }}
                />
                <button style={btn} onClick={addCustom}>담기</button>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button style={{...btn, padding:"8px 14px", background:"#111827", color:"#fff"}} onClick={onSave}>
          나의 저장 식품 저장
        </button>
      </div>
    </div>
  );
}

const inp = { padding:"8px 10px", borderRadius:8, border:"1px solid #e5e7eb" };
