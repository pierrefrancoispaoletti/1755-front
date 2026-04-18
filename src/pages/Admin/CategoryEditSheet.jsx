import React, { useEffect, useState } from "react";
import { Sheet, Button, IconPicker } from "../../design-system";
import { createCategory, updateCategory } from "../../services/categoriesApi";

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const emptyForm = {
  name: "",
  slug: "",
  icon: null,
  iconColor: "#ffffff",
  badgeEnabled: false,
  badgeIcon: "Crown",
  badgeColor: "#D4A24C",
  visible: true,
};

const CategoryEditSheet = ({ open, onClose, category, parentId, onSaved, onError }) => {
  const isEdit = Boolean(category?._id);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      setForm({
        name: category.name || "",
        slug: category.slug || "",
        icon: category.icon || null,
        iconColor: category.iconColor || "#ffffff",
        badgeEnabled: Boolean(category.badge?.icon),
        badgeIcon: category.badge?.icon || "Crown",
        badgeColor: category.badge?.color || "#D4A24C",
        visible: category.visible !== false,
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, category, isEdit]);

  const handleNameChange = (v) => {
    setForm((f) => ({
      ...f,
      name: v,
      slug: isEdit ? f.slug : slugify(v),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const badge = form.badgeEnabled
      ? { icon: form.badgeIcon, color: form.badgeColor }
      : null;
    try {
      if (isEdit) {
        const doc = await updateCategory(category._id, {
          name: form.name,
          icon: form.icon,
          iconColor: form.iconColor,
          badge,
          visible: form.visible,
        });
        onSaved(doc);
      } else {
        const doc = await createCategory({
          name: form.name,
          slug: form.slug,
          parentId: parentId || null,
          icon: form.icon,
          iconColor: form.iconColor,
          badge,
        });
        onSaved(doc);
      }
      onClose();
    } catch (err) {
      onError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? "Éditer catégorie" : "Nouvelle catégorie"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || !form.name || !form.slug}
          >
            {saving ? "..." : "Enregistrer"}
          </Button>
        </>
      }
    >
      <label style={{ display: "block", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "var(--ds-text-muted)" }}>Nom</span>
        <input
          style={inputStyle}
          value={form.name}
          onChange={(e) => handleNameChange(e.target.value)}
        />
      </label>
      <label style={{ display: "block", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "var(--ds-text-muted)" }}>Slug</span>
        <input
          style={{ ...inputStyle, opacity: isEdit ? 0.5 : 1 }}
          value={form.slug}
          readOnly={isEdit}
          onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
        />
        {isEdit && (
          <small style={{ color: "var(--ds-text-muted)" }}>
            Slug immuable après création.
          </small>
        )}
      </label>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "var(--ds-text-muted)" }}>Icône</span>
        <IconPicker
          value={form.icon}
          color={form.iconColor}
          onChange={({ icon, color }) =>
            setForm((f) => ({ ...f, icon, iconColor: color }))
          }
        />
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={form.badgeEnabled}
          onChange={(e) => setForm((f) => ({ ...f, badgeEnabled: e.target.checked }))}
        />
        <span>Badge décoratif (ex: couronne or)</span>
      </label>
      {form.badgeEnabled && (
        <IconPicker
          value={form.badgeIcon}
          color={form.badgeColor}
          onChange={({ icon, color }) =>
            setForm((f) => ({ ...f, badgeIcon: icon, badgeColor: color }))
          }
        />
      )}
      {isEdit && (
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <input
            type="checkbox"
            checked={form.visible}
            onChange={(e) => setForm((f) => ({ ...f, visible: e.target.checked }))}
          />
          <span>Visible</span>
        </label>
      )}
    </Sheet>
  );
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--ds-border-subtle)",
  background: "var(--ds-bg-elevated)",
  color: "var(--ds-text-primary)",
  fontSize: 15,
  marginTop: 4,
};

export default CategoryEditSheet;
