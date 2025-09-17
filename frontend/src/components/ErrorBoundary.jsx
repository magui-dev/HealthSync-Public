import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError:false, error:null }; }
  static getDerivedStateFromError(error){ return { hasError:true, error }; }
  componentDidCatch(err, info){ console.error("ErrorBoundary:", err, info); }
  render(){
    if(this.state.hasError){
      return (
        <div style={{padding:16, color:"crimson"}}>
          컴포넌트 오류: {String(this.state.error)}
        </div>
      );
    }
    return this.props.children;
  }
}
