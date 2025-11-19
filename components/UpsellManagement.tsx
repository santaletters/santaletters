import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Gift, Plus, Edit, Trash2, Save, X, ArrowLeft, Zap } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { InitializeUpsells } from "./InitializeUpsells";

interface Upsell {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  active: boolean;
  promoText?: string;
  features?: string[];
  isSubscription?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface UpsellManagementProps {
  onBack?: () => void;
}

export function UpsellManagement({ onBack }: UpsellManagementProps = {}) {
  const [upsells, setUpsells] = useState<Upsell[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Upsell | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showInitialize, setShowInitialize] = useState(false);

  useEffect(() => {
    loadUpsells();
  }, []);

  const loadUpsells = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/admin/upsells`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUpsells(data.upsells || []);
      }
    } catch (error) {
      console.error("Error loading upsells:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (upsellData: Upsell) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/admin/upsell/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(upsellData),
        }
      );

      if (response.ok) {
        await loadUpsells();
        setIsDialogOpen(false);
        setEditing(null);
      } else {
        alert("Failed to save upsell");
      }
    } catch (error) {
      console.error("Error saving upsell:", error);
      alert("Error saving upsell");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this upsell?")) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/admin/upsell/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        await loadUpsells();
      } else {
        alert("Failed to delete upsell");
      }
    } catch (error) {
      console.error("Error deleting upsell:", error);
      alert("Error deleting upsell");
    }
  };

  const openNewDialog = () => {
    setEditing({
      id: "",
      name: "",
      description: "",
      price: 9.99,
      imageUrl: "",
      active: true,
      promoText: "",
      features: [],
      isSubscription: false,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (upsell: Upsell) => {
    setEditing({ ...upsell });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading upsells...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button onClick={onBack} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            )}
            <div>
              <h2 className="text-2xl font-bold">Upsell Products</h2>
              <p className="text-gray-600">Manage one-click upsell offers shown after checkout</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowInitialize(true)} variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
              <Zap className="w-4 h-4 mr-2" />
              Initialize Products
            </Button>
            <Button onClick={openNewDialog} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Upsell
            </Button>
          </div>
        </div>
        
        {showInitialize && (
          <div className="mb-6">
            <InitializeUpsells />
            <Button 
              onClick={() => {
                setShowInitialize(false);
                loadUpsells();
              }} 
              variant="outline" 
              className="mt-4"
            >
              Close & Refresh
            </Button>
          </div>
        )}

      {upsells.length === 0 ? (
        <Card className="p-12 text-center">
          <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Upsells Yet</h3>
          <p className="text-gray-600 mb-4">Create your first upsell offer to increase revenue</p>
          <Button onClick={openNewDialog} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Create First Upsell
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {upsells.map((upsell) => (
            <Card key={upsell.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">{upsell.name}</h3>
                  <Badge variant={upsell.active ? "default" : "secondary"}>
                    {upsell.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(upsell)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(upsell.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-gray-700">{upsell.description}</p>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-green-600">${upsell.price.toFixed(2)}</div>
                  {upsell.isSubscription && (
                    <Badge className="bg-blue-500">Subscription</Badge>
                  )}
                </div>

                {upsell.promoText && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm text-yellow-800">
                    ⭐ {upsell.promoText}
                  </div>
                )}

                {upsell.features && upsell.features.length > 0 && (
                  <div className="space-y-1">
                    {upsell.features.slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="text-sm text-gray-600">✓ {feature}</div>
                    ))}
                    {upsell.features.length > 3 && (
                      <div className="text-sm text-gray-400">
                        +{upsell.features.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Edit Upsell Product" : "Create New Upsell"}
            </DialogTitle>
            <DialogDescription>
              {editing?.id 
                ? "Update the details of your upsell product." 
                : "Create a new upsell product to offer customers after checkout."}
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <UpsellForm
              upsell={editing}
              onSave={handleSave}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditing(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface UpsellFormProps {
  upsell: Upsell;
  onSave: (upsell: Upsell) => void;
  onCancel: () => void;
}

function UpsellForm({ upsell, onSave, onCancel }: UpsellFormProps) {
  const [formData, setFormData] = useState<Upsell>(upsell);
  const [featuresText, setFeaturesText] = useState(
    upsell.features?.join("\n") || ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const features = featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    onSave({ ...formData, features });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Product Name *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Fake Instant Snow"
          required
        />
      </div>

      <div>
        <Label>Description *</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the product..."
          rows={3}
          required
        />
      </div>

      <div>
        <Label>Price ($) *</Label>
        <Input
          type="number"
          step="0.01"
          min="0.01"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
          required
        />
      </div>

      <div>
        <Label>Image URL</Label>
        <Input
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
        <p className="text-xs text-gray-500 mt-1">Leave blank for default icon</p>
      </div>

      <div>
        <Label>Promo Text (optional)</Label>
        <Input
          value={formData.promoText || ""}
          onChange={(e) => setFormData({ ...formData, promoText: e.target.value })}
          placeholder="e.g., LIMITED TIME: Save 50%!"
        />
      </div>

      <div>
        <Label>Features (one per line)</Label>
        <Textarea
          value={featuresText}
          onChange={(e) => setFeaturesText(e.target.value)}
          placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
          rows={5}
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter each feature on a new line
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={formData.active}
          onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
        />
        <Label>Active (show to customers)</Label>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={formData.isSubscription || false}
          onCheckedChange={(checked) => setFormData({ ...formData, isSubscription: checked })}
        />
        <Label>Subscription Product (monthly recurring)</Label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
          <Save className="w-4 h-4 mr-2" />
          Save Upsell
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  );
}
