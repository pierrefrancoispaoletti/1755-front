import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Button, ICON_MAP } from "../../design-system";
import { fetchFlat as fetchCategoriesFlat } from "../../services/categoriesApi";
import { fetchStatsSummary } from "../../services/statsApi";
import { $SERVER } from "../../_const/_const";
import "./admin.css";
import "./adminHome.css";

const AdminHome = ({ user, setUser }) => {
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [event, setEvent] = useState(null);
  const [statsSummary, setStatsSummary] = useState({
    totalScans: 0,
    distinctLanguages: 0,
    languages: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token-1755");
        const [prodRes, flat, eventRes, statsRes] = await Promise.all([
          axios.get(`${$SERVER}/api/products/allProducts`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetchCategoriesFlat(),
          axios.get(`${$SERVER}/api/events/getEvent`).catch(() => ({ data: {} })),
          fetchStatsSummary().catch(() => ({
            totalScans: 0,
            distinctLanguages: 0,
            languages: [],
          })),
        ]);
        if (!active) return;
        setProducts(prodRes.data?.data || []);
        setCats(flat || []);
        setEvent(eventRes.data?.data || null);
        setStatsSummary(statsRes);
      } catch (e) {
        if (active) setError(e.message || "Erreur de chargement");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = products.length;
    const visible = products.filter((p) => p.visible).length;
    const hidden = total - visible;
    const choice = products.filter((p) => p.choice).length;
    const withImage = products.filter((p) => p.image?.data).length;
    const prices = products.map((p) => p.price).filter((n) => typeof n === "number");
    const avg = prices.length
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : 0;
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;

    const catBySlug = new Map();
    cats.forEach((c) => catBySlug.set(c.slug, c));

    const rootCats = cats.filter((c) => !c.parentId);
    const countByRootSlug = new Map();
    products.forEach((p) => {
      if (!p.type) return;
      countByRootSlug.set(p.type, (countByRootSlug.get(p.type) || 0) + 1);
    });
    const perRoot = rootCats
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        icon: c.icon,
        iconColor: c.iconColor,
        visible: c.visible !== false,
        count: countByRootSlug.get(c.slug) || 0,
      }))
      .sort((a, b) => b.count - a.count);

    const totalCats = cats.length;
    const visibleCats = cats.filter((c) => c.visible !== false).length;

    return {
      total,
      visible,
      hidden,
      choice,
      withImage,
      withoutImage: total - withImage,
      avg,
      min,
      max,
      perRoot,
      totalCats,
      visibleCats,
    };
  }, [products, cats]);

  const fmtPrice = (n) =>
    typeof n === "number" && n > 0 ? `${n.toFixed(2).replace(".", ",")}€` : "—";

  const handleLogout = () => {
    localStorage.removeItem("token-1755");
    setUser("");
  };

  const hasEvent = event && Object.keys(event).length > 0;

  return (
    <div className="ds-root admin-page admin-home">
      <div className="admin-home__head">
        <div>
          <h1>Tableau de bord</h1>
          <p className="subtitle">
            Connecté en tant que {user?.username || "admin"}.
          </p>
        </div>
      </div>

      {error && <div className="admin-home__error">{error}</div>}
      {loading && <div className="admin-home__empty">Chargement des statistiques…</div>}

      {!loading && (
        <>
          <section className="admin-home__stats">
            <StatCard
              icon="Package"
              label="Produits"
              value={stats.total}
              hint={`${stats.visible} visibles · ${stats.hidden} masqués`}
            />
            <StatCard
              icon="Heart"
              label="Coups de cœur"
              value={stats.choice}
              hint={
                stats.total
                  ? `${Math.round((stats.choice / stats.total) * 100)}% du catalogue`
                  : "—"
              }
            />
            <StatCard
              icon="Image"
              label="Avec image"
              value={stats.withImage}
              hint={`${stats.withoutImage} sans image`}
            />
            <StatCard
              icon="FolderTree"
              label="Catégories"
              value={stats.totalCats}
              hint={`${stats.visibleCats} visibles`}
            />
            <StatCard
              icon="Tag"
              label="Prix moyen"
              value={fmtPrice(stats.avg)}
              hint={
                stats.min && stats.max
                  ? `min ${fmtPrice(stats.min)} · max ${fmtPrice(stats.max)}`
                  : "—"
              }
            />
            <StatCard
              icon="Calendar"
              label="Événement"
              value={hasEvent ? event.name : "Aucun"}
              hint={
                hasEvent
                  ? `${event.like || 0} j'aime${event.date ? " · " + new Date(event.date).toLocaleDateString("fr-FR") : ""}`
                  : "Ajoute-en un dans la section Events"
              }
            />
            <StatCard
              icon="Eye"
              label="Scans du menu"
              value={statsSummary.totalScans}
              hint={
                statsSummary.totalScans
                  ? "Cumul depuis mise en place"
                  : "Aucun scan enregistré"
              }
            />
            <StatCard
              icon="MapPin"
              label="Langues utilisées"
              value={statsSummary.distinctLanguages}
              hint={
                statsSummary.languages.length
                  ? statsSummary.languages
                      .slice(0, 3)
                      .map((l) => `${l.lang.toUpperCase()} ${l.count}`)
                      .join(" · ")
                  : "—"
              }
            />
          </section>

          {statsSummary.languages.length > 0 && (
            <section className="admin-home__section">
              <h2 className="admin-home__section-title">Répartition par langue</h2>
              <div className="admin-home__bars">
                {statsSummary.languages.map((l) => {
                  const pct = statsSummary.totalScans
                    ? (l.count / statsSummary.totalScans) * 100
                    : 0;
                  return (
                    <div key={l.lang} className="admin-home__bar">
                      <div className="admin-home__bar-head">
                        <span className="admin-home__bar-name">
                          {ICON_MAP.MapPin && (
                            <ICON_MAP.MapPin
                              size={14}
                              strokeWidth={1.75}
                              style={{ color: "var(--ds-accent-gold)" }}
                            />
                          )}
                          {l.lang.toUpperCase()}
                        </span>
                        <span className="admin-home__bar-count">{l.count}</span>
                      </div>
                      <div className="admin-home__bar-track">
                        <div
                          className="admin-home__bar-fill"
                          style={{
                            width: `${pct}%`,
                            background: "var(--ds-accent-gold)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="admin-home__section">
            <h2 className="admin-home__section-title">Répartition par catégorie racine</h2>
            <div className="admin-home__bars">
              {stats.perRoot.map((c) => {
                const Icon = ICON_MAP[c.icon] || ICON_MAP.Tag;
                const pct = stats.total ? (c.count / stats.total) * 100 : 0;
                return (
                  <div key={c.slug} className="admin-home__bar">
                    <div className="admin-home__bar-head">
                      <span className="admin-home__bar-name">
                        {Icon && (
                          <Icon
                            size={16}
                            strokeWidth={1.75}
                            style={{ color: c.iconColor || "var(--ds-accent-gold)" }}
                          />
                        )}
                        {c.name}
                      </span>
                      <span className="admin-home__bar-count">{c.count}</span>
                    </div>
                    <div className="admin-home__bar-track">
                      <div
                        className="admin-home__bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: c.iconColor || "var(--ds-accent-wine)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {stats.perRoot.length === 0 && (
                <div className="admin-home__empty">Pas encore de catégories racines.</div>
              )}
            </div>
          </section>
        </>
      )}

      <div className="admin-logout">
        <Button variant="ghost" onClick={handleLogout}>
          Déconnexion
        </Button>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, hint }) => {
  const Icon = ICON_MAP[icon] || ICON_MAP.Tag;
  return (
    <div className="admin-home__card">
      <div className="admin-home__card-icon">
        {Icon && <Icon size={20} strokeWidth={1.75} />}
      </div>
      <div className="admin-home__card-body">
        <span className="admin-home__card-label">{label}</span>
        <span className="admin-home__card-value">{value}</span>
        {hint && <span className="admin-home__card-hint">{hint}</span>}
      </div>
    </div>
  );
};

export default AdminHome;
