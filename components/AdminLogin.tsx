import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Lock, Smartphone, Shield, Eye, EyeOff } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToSales: () => void;
}

export function AdminLogin({ onLoginSuccess, onBackToSales }: AdminLoginProps) {
  const [step, setStep] = useState<"password" | "2fa" | "setup2fa">("password");
  const [password, setPassword] = useState("");
  const [code2FA, setCode2FA] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret2FA, setSecret2FA] = useState("");

  const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-cf244566`;

  // Check if 2FA is already set up
  useEffect(() => {
    checkIfSetupRequired();
  }, []);

  const checkIfSetupRequired = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/check-2fa-setup`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // If no secret exists, user will need to set up 2FA after password
      }
    } catch (error) {
      console.error("Error checking 2FA setup:", error);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin/verify-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requires2FASetup) {
          // First time login - need to set up 2FA
          setQrCodeUrl(data.qrCode);
          setSecret2FA(data.secret);
          setStep("setup2fa");
        } else {
          // 2FA already set up - proceed to verification
          setStep("2fa");
        }
      } else {
        setError(data.error || "Invalid password");
      }
    } catch (error) {
      console.error("Error verifying password:", error);
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin/verify-2fa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ 
          password, 
          code: code2FA 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store session with expiry (4 hours)
        const session = {
          authenticated: true,
          timestamp: Date.now(),
          expiresIn: 4 * 60 * 60 * 1000, // 4 hours
        };
        localStorage.setItem("adminSession", JSON.stringify(session));
        onLoginSuccess();
      } else {
        setError(data.error || "Invalid authentication code");
        setCode2FA("");
      }
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin/setup-2fa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ 
          password,
          code: code2FA,
          secret: secret2FA
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store session with expiry (4 hours)
        const session = {
          authenticated: true,
          timestamp: Date.now(),
          expiresIn: 4 * 60 * 60 * 1000, // 4 hours
        };
        localStorage.setItem("adminSession", JSON.stringify(session));
        onLoginSuccess();
      } else {
        setError(data.error || "Invalid authentication code");
        setCode2FA("");
      }
    } catch (error) {
      console.error("Error setting up 2FA:", error);
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(to bottom, #1a472a 0%, #2d5a3d 100%)",
      }}
    >
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl mb-2" style={{ fontFamily: "Pacifico, cursive" }}>
            Admin Login
          </h1>
          <p className="text-sm text-gray-600">
            {step === "password" && "Enter your password to continue"}
            {step === "2fa" && "Enter your 6-digit authentication code"}
            {step === "setup2fa" && "Set up two-factor authentication"}
          </p>
        </div>

        {step === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label className="block text-sm mb-2">
                <Lock className="inline w-4 h-4 mr-2" />
                Admin Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  autoFocus
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {loading ? "Verifying..." : "Continue"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onBackToSales}
              className="w-full"
            >
              Back to Home
            </Button>
          </form>
        )}

        {step === "setup2fa" && (
          <form onSubmit={handleSetup2FASubmit} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm mb-2 flex items-center">
                <Smartphone className="w-4 h-4 mr-2" />
                Set Up Authenticator App
              </h3>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Scan the QR code below with your authenticator app</li>
                <li>Enter the 6-digit code shown in your app</li>
              </ol>
            </div>

            <div className="flex justify-center bg-white p-4 rounded-lg border">
              <img 
                src={qrCodeUrl} 
                alt="2FA QR Code"
                className="w-48 h-48"
              />
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Manual Entry Code:</p>
              <code className="text-xs break-all">{secret2FA}</code>
            </div>

            <div>
              <label className="block text-sm mb-2">
                6-Digit Authentication Code
              </label>
              <Input
                type="text"
                value={code2FA}
                onChange={(e) => setCode2FA(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                required
                maxLength={6}
                className="text-center text-2xl tracking-widest"
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || code2FA.length !== 6}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {loading ? "Verifying..." : "Complete Setup & Login"}
            </Button>
          </form>
        )}

        {step === "2fa" && (
          <form onSubmit={handle2FASubmit} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 flex items-center">
                <Smartphone className="w-4 h-4 mr-2" />
                Open your authenticator app and enter the 6-digit code
              </p>
            </div>

            <div>
              <label className="block text-sm mb-2">
                6-Digit Authentication Code
              </label>
              <Input
                type="text"
                value={code2FA}
                onChange={(e) => setCode2FA(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                required
                maxLength={6}
                className="text-center text-2xl tracking-widest"
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || code2FA.length !== 6}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {loading ? "Verifying..." : "Login"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep("password");
                setPassword("");
                setCode2FA("");
                setError("");
              }}
              className="w-full"
            >
              Back
            </Button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-xs text-gray-500">
            🔒 Protected by password + two-factor authentication
          </p>
        </div>
      </Card>
    </div>
  );
}
