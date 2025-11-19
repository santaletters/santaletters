import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface AffiliateAuthProps {
  onLogin: (affiliateId: string, affiliateName: string) => void;
  onBackToSales: () => void;
}

export function AffiliateAuth({ onLogin, onBackToSales }: AffiliateAuthProps) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-cf244566`;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (demoMode) {
        // Demo login
        setTimeout(() => {
          onLogin("aff_demo_12345", "Demo Partner");
          setLoading(false);
        }, 500);
        return;
      }

      const response = await fetch(`${API_URL}/affiliate/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const data = await response.json();
      
      // Store affiliate session
      localStorage.setItem("affiliateSession", JSON.stringify({
        affiliateId: data.affiliateId,
        affiliateName: data.affiliateName,
        token: data.token,
      }));

      onLogin(data.affiliateId, data.affiliateName);
    } catch (error) {
      console.error("Login error:", error);
      alert(error instanceof Error ? error.message : "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupPassword !== signupConfirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (signupPassword.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      if (demoMode) {
        // Demo signup
        setTimeout(() => {
          alert("Demo account created! You can now log in with your credentials.");
          setSignupName("");
          setSignupEmail("");
          setSignupPassword("");
          setSignupConfirmPassword("");
          setLoading(false);
        }, 500);
        return;
      }

      const response = await fetch(`${API_URL}/affiliate/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Signup failed");
      }

      alert("Account created successfully! Please wait for admin approval. You'll receive an email when your account is activated.");
      setSignupName("");
      setSignupEmail("");
      setSignupPassword("");
      setSignupConfirmPassword("");
    } catch (error) {
      console.error("Signup error:", error);
      alert(error instanceof Error ? error.message : "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 p-4 md:p-8">
      <div className="max-w-md mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <Button onClick={onBackToSales} variant="outline" className="text-sm">
            ← Back to Sales Page
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1
            className="text-4xl md:text-5xl mb-4"
            style={{ fontFamily: '"Pacifico", cursive', color: "#dc2626" }}
          >
            🎄 Affiliate Portal
          </h1>
          <p className="text-gray-600">Join our affiliate program and earn commissions!</p>
        </div>

        {/* Demo Mode Toggle */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Button
            onClick={() => setDemoMode(!demoMode)}
            variant={demoMode ? "default" : "outline"}
            className={demoMode ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            {demoMode ? "🎭 Demo Mode Active" : "🎭 Try Demo Mode"}
          </Button>
        </div>

        <Card className="p-6">
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="mt-2"
                  />
                </div>
                {demoMode && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-800">
                    <strong>Demo Mode:</strong> Just click "Login" to access the demo affiliate dashboard with sample performance data, custom pricing links, and tracking features.
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="signup-name">Full Name / Business Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Smith or Smith Marketing"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                    disabled={loading}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                </div>
                <div>
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="mt-2"
                  />
                </div>
                {demoMode && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-800">
                    <strong>Demo Mode:</strong> Create a demo account to see how signup works.
                  </div>
                )}
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800">
                  Your account will need admin approval before you can start earning commissions.
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Info Section */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p className="mb-2">
            <strong>Why join our affiliate program?</strong>
          </p>
          <ul className="text-left max-w-sm mx-auto space-y-1">
            <li>✓ Earn up to 25% commission per sale</li>
            <li>✓ Custom pricing options for your audience</li>
            <li>✓ Real-time tracking and reporting</li>
            <li>✓ Postback URL and pixel tracking support</li>
            <li>✓ Sub-ID tracking for campaign optimization</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
