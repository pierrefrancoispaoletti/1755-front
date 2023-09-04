import {
  faBeer,
  faCheeseburger,
  faCocktail,
  faCookieBite,
  faGlassChampagne,
  faGlassCitrus,
  faGlassWhiskeyRocks,
  faHatChef,
  faShoppingBag,
  faWineBottle,
} from "@fortawesome/pro-duotone-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const categories = [
  {
    name: "Les Vins",
    slug: "vins",
    icon: (
      <FontAwesomeIcon
        icon={faWineBottle}
        size="4x"
        style={{
          "--fa-primary-color": "#AF2127",
          "--fa-secondary-color": "grey",
        }}
      />
    ),
    subCategories: [
      {
        name: "Vins Rouges",
        slug: "rouges",
        icon: (
          <FontAwesomeIcon
            size="3x"
            icon={faWineBottle}
            style={{ "--fa-primary-color": "darkred" }}
          />
        ),
        subCat: [
          {
            name: "Vins Corses",
            slug: "corses",
          },
          {
            name: "Millésimes",
            slug: "millesimes",
          },
          {
            name: "Magnums",
            slug: "magnums",
          },
          {
            name: "Bordeaux",
            slug: "bordeaux",
          },
          {
            name: "Bourgognes",
            slug: "bourgognes",
          },
          {
            name: "Côtes-du-rhône",
            slug: "cotes-du-rhone",
          },
          {
            name: "Vins d'Italie",
            slug: "decouverte",
          },
          {
            name: "Vins du Monde",
            slug: "monde",
          },
        ],
      },
      {
        name: "Vins Rosés",
        slug: "roses",
        icon: (
          <FontAwesomeIcon
            size="3x"
            icon={faWineBottle}
            style={{ "--fa-primary-color": "#fec5d9" }}
          />
        ),
      },
      {
        name: "Vins Blancs",
        slug: "blancs",
        icon: (
          <FontAwesomeIcon
            size="3x"
            icon={faWineBottle}
            style={{ "--fa-primary-color": "#f1f285" }}
          />
        ),
        subCat: [
          {
            name: "Vins Corses",
            slug: "corses-blancs",
          },
          {
            name: "Magnums",
            slug: "magnums-blancs",
          },
        ],
      },
      {
        name: "Champagnes",
        slug: "champagnes",
        icon: (
          <FontAwesomeIcon
            size="3x"
            icon={faGlassChampagne}
            style={{ "--fa-secondary-color": "#f1f285" }}
          />
        ),
      },
    ],
  },
  {
    name: "Les Bières",
    slug: "bieres",
    icon: (
      <FontAwesomeIcon
        size="4x"
        icon={faBeer}
        style={{
          "--fa-primary-color": "#AF2127",
          "--fa-secondary-color": "grey",
        }}
      />
    ),
  },
  {
    name: "Les Alcools",
    slug: "alcools",
    icon: (
      <FontAwesomeIcon
        size="4x"
        icon={faGlassWhiskeyRocks}
        style={{
          "--fa-primary-color": "#AF2127",
          "--fa-secondary-color": "grey",
        }}
      />
    ),
    subCategories: [
      {
        name: "Les Premiums",
        slug: "premiums",
        icon: (
          <FontAwesomeIcon
            size="3x"
            icon={faGlassWhiskeyRocks}
            style={{ "--fa-primary-color": "#f1f285" }}
          />
        ),
        subCat: [
          {
            name: "Rhum",
            slug: "rhum",
          },
          {
            name: "Gin",
            slug: "gin",
          },
          {
            name: "Whisky",
            slug: "whisky",
          },
          {
            name: "Vodka",
            slug: "vodka",
          },
        ],
      },
      {
        name: "Les Classiques",
        slug: "classiques",
        icon: (
          <FontAwesomeIcon
            size="3x"
            icon={faGlassWhiskeyRocks}
            style={{ "--fa-primary-color": "#f1f285" }}
          />
        ),
      },
    ],
  },
  {
    name: "Les Cocktails",
    slug: "cocktails",
    icon: (
      <FontAwesomeIcon
        size="4x"
        icon={faCocktail}
        style={{
          "--fa-primary-color": "#AF2127",
          "--fa-secondary-color": "grey",
        }}
      />
    ),
  },
  {
    name: "Les Softs",
    slug: "softs",
    icon: (
      <FontAwesomeIcon
        size="4x"
        icon={faGlassCitrus}
        style={{
          "--fa-primary-color": "#AF2127",
          "--fa-secondary-color": "grey",
        }}
      />
    ),
  },
  {
    name: "La Cuisine",
    slug: "cuisine",
    icon: (
      <FontAwesomeIcon
        size="4x"
        icon={faHatChef}
        style={{
          "--fa-primary-color": "#AF2127",
          "--fa-secondary-color": "grey",
        }}
      />
    ),
    subCategories: [
      {
        name: "Les Tapas",
        slug: "tapas",
        icon: (
          <FontAwesomeIcon
            size="3x"
            icon={faCheeseburger}
            style={{ "--fa-primary-color": "darkred" }}
          />
        ),
      },
      {
        name: "Les Desserts",
        slug: "desserts",
        icon: (
          <FontAwesomeIcon
            size="3x"
            icon={faCookieBite}
            style={{ "--fa-primary-color": "darkred" }}
          />
        ),
      },
    ],
  },
  {
    name: "La Boutique",
    slug: "boutique",
    icon: (
      <FontAwesomeIcon
        size="4x"
        icon={faShoppingBag}
        style={{
          "--fa-primary-color": "#AF2127",
          "--fa-secondary-color": "grey",
        }}
      />
    ),
  },
];

export default categories;
