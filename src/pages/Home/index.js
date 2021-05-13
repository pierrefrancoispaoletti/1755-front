import React from "react";
import { Container, Header } from "semantic-ui-react";
import "./home.css"

const Home = () => {
  return (
    <Container>
      <Header className="home-header" as="h1">Bienvenue au 1755...</Header>

      <Container text className="home-presentation">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Eum aut odit
          iure hic laboriosam molestias saepe consequatur possimus at doloremque
          laudantium recusandae cum earum, tenetur incidunt veritatis fuga dicta
          numquam qui id officiis sit nemo? Sapiente, numquam ab. Molestiae
          quidem dolores, alias iste voluptatibus maxime impedit consectetur sed
          eum natus.
        </p>
        <span>Christophe</span>
      </Container>
    </Container>
  );
};

export default Home;
