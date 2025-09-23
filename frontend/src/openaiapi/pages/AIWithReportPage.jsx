import React, { useState } from "react";
import ReportPicker from "../../userinfoui/components/ReportPicker";
import UserInfoPage from "../../userinfoui/pages/UserInfoPage";
import AIChatPage from "../components/AIChatPage";
import "./AIWithReportPage.css";

export default function AIWithReportPage() {
  const [selectedReport, setSelectedReport] = useState(null);

  return (
    <div className="ai-with-report">
      <div className="left-panel">
        {/* 리포트 선택 UI */}
        <ReportPicker onSelect={setSelectedReport} />

        {/* 리포트를 선택했을 때만 UserInfoPage 표시 */}
        {selectedReport && (
          <div style={{ marginTop: "16px" }}>
            <UserInfoPage report={selectedReport} />
          </div>
        )}
      </div>

      <div className="right-panel">
        <AIChatPage selectedReport={selectedReport} />
      </div>
    </div>
  );
}
