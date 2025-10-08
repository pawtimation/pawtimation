import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { Landing } from "./Landing";
import { OwnerStart } from "./OwnerStart";
import { CompanionStart } from "./CompanionStart";
import { OwnerOnboarding } from "./OwnerOnboarding";
import { PawtimateFlow } from "./PawtimateFlow";
import { FriendsInvite } from "./FriendsInvite";
import { BookingFeed } from "./BookingFeed";
import { BrowseSitters } from "./BrowseSitters";
import { TrustCard } from "./TrustCard";
import { CancelBooking } from "./CancelBooking";
import { ReportIncident } from "./ReportIncident";
import { AboutUs } from "./AboutUs";
import { SubscriptionPlans } from "./SubscriptionPlans";
import { OwnerCircle } from "./OwnerCircle";
import { Chat } from "./Chat";
import { JoinInvite } from "./JoinInvite";
import { SitterEdit } from "./SitterEdit";
import { SitterPublic } from "./SitterPublic";
import { PetManager } from "./PetManager";
import { CompanionServices } from "./CompanionServices";
import { CompanionAvailability } from "./CompanionAvailability";
import { CompanionChecklist } from "./CompanionChecklist";
import { CompanionCalendar } from "./CompanionCalendar";
import { CompanionOpportunities } from "./CompanionOpportunities";
import { CompanionMessages } from "./CompanionMessages";
import { CompanionPhoto } from "./CompanionPhoto";
import { CompanionBio } from "./CompanionBio";
import { CompanionVerification } from "./CompanionVerification";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ChatWidget } from "../components/ChatWidget";
import { SitterDashboard } from "./SitterDashboard";
import { Login } from "./Login";
import { Register } from "./Register";
import { auth } from "../lib/auth";
import BookingAuto from "./BookingAuto";
import { Community } from "./Community";
import { SupportMetrics } from "./SupportMetrics";
import { Account } from "./Account";
import { CommunityEvents } from "./CommunityEvents";
import { DashboardOwner } from "./DashboardOwner";
import { DashboardCompanion } from "./DashboardCompanion";
import { DashboardChoose } from "./DashboardChoose";
import { AuthGuard } from "../components/AuthGuard";
import { AdminGuard } from "../components/AdminGuard";
import { AdminRibbon } from "../components/AdminRibbon";
import { AdminDashboard } from "./AdminDashboard";
import { AdminMasquerade } from "./AdminMasquerade";
import { AdminSupport } from "./AdminSupport";
import { AdminVerification } from "./AdminVerification";
import { AdminMetrics } from "./AdminMetrics";

function AppContent() {
  const [currentUser, setCurrentUser] = useState(auth.user);
  const [masqueradeData, setMasqueradeData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem("pt_user");
    const storedToken = localStorage.getItem("pt_token");
    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        auth.user = user;
        auth.token = storedToken;
        setCurrentUser(user);
      } catch (e) {
        localStorage.removeItem("pt_user");
        localStorage.removeItem("pt_token");
      }
    }

    const masquerade = localStorage.getItem("pt_masquerade");
    if (masquerade) {
      try {
        setMasqueradeData(JSON.parse(masquerade));
      } catch (e) {
        localStorage.removeItem("pt_masquerade");
      }
    }
  }, []);

  async function handleExitMasquerade() {
    const masquerade = localStorage.getItem("pt_masquerade");
    if (masquerade) {
      try {
        const data = JSON.parse(masquerade);
        auth.user = data.originalUser;
        auth.token = data.originalToken;
        localStorage.setItem("pt_user", JSON.stringify(data.originalUser));
        localStorage.setItem("pt_token", data.originalToken);
        localStorage.removeItem("pt_masquerade");
        setMasqueradeData(null);
        setCurrentUser(data.originalUser);
        navigate("/admin");
      } catch (e) {
        localStorage.removeItem("pt_masquerade");
        setMasqueradeData(null);
      }
    }
  }

  function handleAuthSuccess(user) {
    auth.user = user;
    auth.token = localStorage.getItem("pt_token") || "";
    setCurrentUser(user);

    const params = new URLSearchParams(location.search);
    const returnTo = params.get("returnTo");
    const role = params.get("role");

    if (returnTo) {
      navigate(returnTo);
    } else if (role === "companion") {
      navigate("/companion/checklist");
    } else {
      navigate("/dashboard/choose");
    }
  }

  function handleNav(path) {
    navigate(path);
  }

  return (
    <div className="flex flex-col min-h-screen">
      {masqueradeData && (
        <AdminRibbon
          masqueradingAs={masqueradeData.actingAs}
          onExit={handleExitMasquerade}
        />
      )}
      <div className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-4 md:px-6 md:py-6">
          <Header onNav={handleNav} user={currentUser} />
          <Routes>
            <Route
              path="/"
              element={
                <Landing
                  onSignIn={() => navigate("/auth/signin")}
                  onRegister={(role) =>
                    navigate(`/auth/register?role=${role}`)
                  }
                  onDashboard={(role) => navigate(`/${role}`)}
                />
              }
            />
            <Route
              path="/auth/signin"
              element={
                <Login
                  onSuccess={handleAuthSuccess}
                  onBack={() => navigate("/")}
                />
              }
            />
            <Route
              path="/auth/register"
              element={
                <Register
                  onSuccess={handleAuthSuccess}
                  onBack={() => navigate("/")}
                />
              }
            />
            <Route
              path="/owner"
              element={
                <AuthGuard>
                  <DashboardOwner />
                </AuthGuard>
              }
            />
            <Route
              path="/companion"
              element={
                <AuthGuard>
                  <DashboardCompanion />
                </AuthGuard>
              }
            />
            <Route
              path="/dashboard/choose"
              element={
                <AuthGuard>
                  <DashboardChoose
                    onChoose={(role) => navigate(`/${role}`)}
                    onBack={() => navigate("/")}
                  />
                </AuthGuard>
              }
            />
            <Route
              path="/account"
              element={
                <AuthGuard>
                  <Account
                    onBack={() => navigate("/")}
                    onNavigate={handleNav}
                  />
                </AuthGuard>
              }
            />
            <Route
              path="/community"
              element={<Community onBack={() => navigate("/")} />}
            />
            <Route
              path="/community/events"
              element={<CommunityEvents onBack={() => navigate("/")} />}
            />
            <Route
              path="/owner/circle"
              element={
                <AuthGuard>
                  <OwnerCircle
                    onBack={() => navigate("/owner")}
                    onChat={(roomId) => navigate(`/chat?room=${roomId}`)}
                  />
                </AuthGuard>
              }
            />
            <Route
              path="/owner/pets"
              element={
                <AuthGuard>
                  <PetManager onBack={() => navigate("/owner")} />
                </AuthGuard>
              }
            />
            <Route
              path="/owner/booking"
              element={
                <AuthGuard>
                  <BookingAuto
                    onBack={() => navigate("/owner")}
                    onSuccess={() => navigate("/owner")}
                  />
                </AuthGuard>
              }
            />
            <Route
              path="/companion/start"
              element={<CompanionStart />}
            />
            <Route
              path="/companion/checklist"
              element={
                <AuthGuard>
                  <CompanionChecklist />
                </AuthGuard>
              }
            />
            <Route
              path="/companion/photo"
              element={
                <AuthGuard>
                  <CompanionPhoto />
                </AuthGuard>
              }
            />
            <Route
              path="/companion/bio"
              element={
                <AuthGuard>
                  <CompanionBio />
                </AuthGuard>
              }
            />
            <Route
              path="/companion/calendar"
              element={
                <AuthGuard>
                  <CompanionCalendar />
                </AuthGuard>
              }
            />
            <Route
              path="/companion/opportunities"
              element={
                <AuthGuard>
                  <CompanionOpportunities />
                </AuthGuard>
              }
            />
            <Route
              path="/companion/messages"
              element={
                <AuthGuard>
                  <CompanionMessages />
                </AuthGuard>
              }
            />
            <Route
              path="/companion/verification"
              element={
                <AuthGuard>
                  <CompanionVerification />
                </AuthGuard>
              }
            />
            <Route
              path="/companion/edit"
              element={
                <AuthGuard>
                  <SitterEdit
                    sitterId={auth.user?.sitterId || "s_demo_companion"}
                    onBack={() => navigate("/companion")}
                    onPreview={(id) => navigate(`/companion/preview?id=${id}`)}
                  />
                </AuthGuard>
              }
            />
            <Route
              path="/companion/preview"
              element={
                <AuthGuard>
                  <SitterPublic
                    sitterId={
                      new URLSearchParams(location.search).get("id") ||
                      auth.user?.sitterId ||
                      "s_demo_companion"
                    }
                    onBack={() => navigate("/companion")}
                  />
                </AuthGuard>
              }
            />
            <Route
              path="/companion/services"
              element={
                <AuthGuard>
                  <CompanionServices
                    sitterId={auth.user?.sitterId || "s_demo_companion"}
                    onBack={() => navigate("/companion")}
                  />
                </AuthGuard>
              }
            />
            <Route
              path="/companion/availability"
              element={
                <AuthGuard>
                  <CompanionAvailability
                    sitterId={auth.user?.sitterId || "s_demo_companion"}
                    onBack={() => navigate("/companion")}
                  />
                </AuthGuard>
              }
            />
            <Route
              path="/chat"
              element={
                <AuthGuard>
                  <Chat
                    roomId={new URLSearchParams(location.search).get("room")}
                    onBack={() => navigate("/owner")}
                  />
                </AuthGuard>
              }
            />
            <Route
              path="/about"
              element={<AboutUs onBack={() => navigate("/")} />}
            />
            <Route
              path="/support/metrics"
              element={<SupportMetrics onBack={() => navigate("/")} />}
            />
            <Route
              path="/admin"
              element={
                <AdminGuard>
                  <AdminDashboard />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/masquerade"
              element={
                <AdminGuard>
                  <AdminMasquerade />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/support"
              element={
                <AdminGuard>
                  <AdminSupport />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/verification"
              element={
                <AdminGuard>
                  <AdminVerification />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/metrics"
              element={
                <AdminGuard>
                  <AdminMetrics />
                </AdminGuard>
              }
            />
            <Route path="/owners" element={<Navigate to="/" replace />} />
            <Route path="/companions" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
      <Footer onNav={handleNav} />
      <ChatWidget />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
