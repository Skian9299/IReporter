import React from "react";
import "./Home.css";


const Home = () => {
  return (
    <div>
      {/* Home Section */}
      <div className="home">
        <div className="overlay"></div>
        <h1>MAKE YOUR VOICE COUNT</h1>
        <p>
          “iReporter helps to empower citizens to report corruption and incidents requiring government intervention”
        </p>
      </div>

      {/* How It Works Section - Now Outside the Home Div */}
      <div id="how-it-works" className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="circle">1</div>
            <p>Create and submit a red-flag or intervention record.</p>
          </div>
          <div className="step">
            <div className="circle">2</div>
            <p>Your record gets submitted to the appropriate authority.</p>
          </div>
          <div className="step">
            <div className="circle">3</div>
            <p>Your record gets reviewed, and you receive real-time feedback.</p>
          </div>
        </div>
      </div>

      {/* Top Features Section - Now Outside the Home Div */}
      <div id="top-features" className="top-features">
        <h2>Top Features</h2>
        <div className="features-container">
          <div className="feature">
            <div className="icon">🔔</div>
            <p>Receive real-time email and SMS notifications.</p>
          </div>
          <div className="feature">
            <div className="icon">📍</div>
            <p>Set your location while reporting.</p>
          </div>
          <div className="feature">
            <div className="icon">📷</div>
            <p>Add media (photos/videos) to validate reports.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
