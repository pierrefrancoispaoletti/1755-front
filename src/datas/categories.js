import {
  faBeer,
  faBurger,
  faCocktail,
  faCookieBite,
  faChampagneGlasses,
  faMartiniGlassCitrus,
  faGlassWhiskey,
  faShoppingBag,
  faWineBottle,
  faUtensils,
  faBowlFood,
  faGlassWaterDroplet,
  faGlasses,
  faGlassWater,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isBefore18h } from "./utils";

const categories = [
  {
    name: "La Cuisine (Midi)",
    slug: "cuisine-midi",
    showAlways: isBefore18h(),
    icon: (
      <FontAwesomeIcon
        icon={faUtensils}
        size='4x'
        color='white'
      />
    ),
    subCategories: [
      {
        name: "Les Plats",
        slug: "plats-midi",
        icon: (
          <FontAwesomeIcon
            size='3x'
            icon={faBowlFood}
            color='white'
          />
        ),
      },
      {
        name: "Les Desserts",
        slug: "desserts-midi",
        icon: (
          <FontAwesomeIcon
            size='3x'
            icon={faCookieBite}
            color='white'
          />
        ),
      },
    ],
  },
  {
    name: "Les Vins",
    slug: "vins",
    showAlways: true,
    icon: (
      <FontAwesomeIcon
        icon={faWineBottle}
        size='4x'
        color='white'
      />
    ),
    subCategories: [
      {
        name: "Vins Rouges",
        slug: "rouges",
        icon: (
          <FontAwesomeIcon
            size='3x'
            icon={faWineBottle}
            color='darkred'
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
            size='3x'
            icon={faWineBottle}
            color='#fec5d9'
          />
        ),
      },
      {
        name: "Vins Blancs",
        slug: "blancs",
        icon: (
          <FontAwesomeIcon
            size='3x'
            icon={faWineBottle}
            color='#f1f285'
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
            size='3x'
            icon={faChampagneGlasses}
            color='white'
          />
        ),
      },
    ],
  },
  {
    name: "Les Bières",
    slug: "bieres",
    showAlways: true,
    icon: (
      <FontAwesomeIcon
        size='4x'
        icon={faBeer}
        color='white'
      />
    ),
  },
  {
    name: "Les Alcools",
    slug: "alcools",
    showAlways: true,
    icon: (
      <FontAwesomeIcon
        size='4x'
        icon={faGlassWhiskey}
        color='white'
      />
    ),
    subCategories: [
      {
        name: "Les Premiums",
        slug: "premiums",
        icon: (
          <FontAwesomeIcon
            size='3x'
            icon={faGlassWhiskey}
            color='white'
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
            size='3x'
            icon={faGlassWhiskey}
            color='white'
          />
        ),
      },
    ],
  },
  {
    name: "Les Cocktails",
    slug: "cocktails",
    showAlways: !isBefore18h(),
    icon: (
      <FontAwesomeIcon
        size='4x'
        icon={faCocktail}
        color='white'
      />
    ),
  },
  {
    name: "Les Softs",
    slug: "softs",
    showAlways: true,
    icon: (
      <FontAwesomeIcon
        size='4x'
        icon={faGlassWater}
        color='white'
      />
    ),
  },
  {
    name: "La Cuisine",
    slug: "cuisine",
    showAlways: !isBefore18h(),
    icon: (
      <FontAwesomeIcon
        icon={faUtensils}
        size='4x'
        color='white'
      />
    ),
    subCategories: [
      {
        name: "Les Tapas",
        slug: "tapas",
        icon: (
          <FontAwesomeIcon
            size='3x'
            icon={faBurger}
            color='white'
          />
        ),
      },
      {
        name: "Les Desserts",
        slug: "desserts",
        icon: (
          <FontAwesomeIcon
            size='3x'
            icon={faCookieBite}
            color='white'
          />
        ),
      },
    ],
  },
  {
    name: "La Boutique",
    slug: "boutique",
    showAlways: !isBefore18h(),
    icon: (
      <FontAwesomeIcon
        size='4x'
        icon={faShoppingBag}
        color='white'
      />
    ),
  },
];

export default categories;
