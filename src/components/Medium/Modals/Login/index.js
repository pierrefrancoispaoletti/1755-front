import axios from "axios";
import React, { useState } from "react";
import { Button, Form, Header, Icon, Modal } from "semantic-ui-react";
import { $SERVER } from "../../../../_const/_const";

const Login = ({
  setOpenLoginModal,
  openLoginModal,
  setUser,
  setAppMessage,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    axios({
      method: "post",
      url: `${$SERVER}/auth/login`,
      data: {
        email,
        password,
      },
    })
      .then((response) => {
        setUser(response.data.role);
        setAppMessage({
          success: response.data.status === 200 ? true : false,
          message: response.data.message,
        });
        localStorage.setItem("token-1755", response.data.token);
        setOpenLoginModal(false);
      })
      .catch((error) => {
        setAppMessage({
          success: false,
          message: "il y a eu un probléme durant la connexion",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };
  return (
    <Modal
      onClose={() => setOpenLoginModal(false)}
      onOpen={() => setOpenLoginModal(true)}
      open={openLoginModal}
      size="small"
    >
      <Header icon>
        <Icon name="user" />
        Se Connecter
      </Header>
      <Modal.Content>
        <Form onSubmit={handleSubmit} id="auth-form">
          <Form.Field>
            <label>E-Mail</label>
            <input
              value={email}
              type="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Field>
          <Form.Field>
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Field>
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button
          color="green"
          loading={loading}
          type="submit"
          form="auth-form"
          disabled={email.length === 0 || password.length === 0 || loading}
          inverted
        >
          <Icon name="checkmark" /> Connexion
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default Login;
