import { useState } from "react";
import { api } from "../../api/axios";
import "./ProfileEditModal.css";

export default function ProfileEditModal({ open, onClose }) {
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState("male");
  const [activityLevel, setActivityLevel] = useState(null);

  if (!open) return null;

  const handleSave = async () => {
    if (height < 100 || height > 250) {
      alert("키는 100cm 이상, 250cm 이하로 입력해주세요.");
      return;
    }
    if (!activityLevel) {
      alert("활동 레벨을 선택해주세요.");
      return;
    }

    try {
      await api.put("/profile",
      {
        age: Number(age),
        height: Number(height),
        weight: Number(weight),
        gender: gender.toUpperCase(), // GenderType(enum) 맞추기 위해
        activityLevel: activityLevel,
      },
    );

      alert("프로필이 성공적으로 수정되었습니다.");
      onClose();
    } catch (err) {
      console.error(err);
      alert("프로필 수정 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="modalOverlay">
      <div className="modalContent">
        <h2>프로필 편집</h2>

        <label>
          나이:{" "}
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="예: 25"
          />{" "}
          세
        </label>

        <label>
          키:{" "}
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="예: 175"
          />{" "}
          cm
        </label>
        <p className="hint">※ 키는 100cm 이상, 250cm 이하로 입력해주세요.</p>

        <label>
          몸무게:{" "}
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="예: 70"
          />{" "}
          kg
        </label>

        <label>
          성별:{" "}
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="male">남성</option>
            <option value="female">여성</option>
          </select>
        </label>

        <div className="activityLevel">
          <p>활동 레벨:</p>
          <button
            className={activityLevel === 1 ? "active" : ""}
            onClick={() => setActivityLevel(1)}
          >
            1. 사무실에서 일만 (운동 거의 없음)
          </button>
          <button
            className={activityLevel === 2 ? "active" : ""}
            onClick={() => setActivityLevel(2)}
          >
            2. 조금 활동적 (주 2회 가벼운 운동)
          </button>
          <button
            className={activityLevel === 3 ? "active" : ""}
            onClick={() => setActivityLevel(3)}
          >
            3. 중간 강도의 운동 (주 3~5일)
          </button>
          <button
            className={activityLevel === 4 ? "active" : ""}
            onClick={() => setActivityLevel(4)}
          >
            4. 고강도 운동 (주 6~7일)
          </button>
        </div>

        <div className="modalActions">
          <button onClick={handleSave}>저장</button>
          <button onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}
