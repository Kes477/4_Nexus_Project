from django.contrib.auth.tokens import PasswordResetTokenGenerator


class TokenActivacionGenerator(PasswordResetTokenGenerator):

    key_salt = "usuarios.tokens.activacion"

    def _make_hash_value(self, user, timestamp):

        return (
            super()._make_hash_value(user, timestamp)
            + str(user.estado_cuenta)
            + str(user.is_active)
        )

    def check_token(self, user, token):

        if not super().check_token(user, token):
            return False

        try:

            timestamp = int(token.split("-")[0], 36)

        except (ValueError, IndexError):

            return False

        antiguedad = (
            self._num_seconds(self._now()) - timestamp
        )

        return 0 <= antiguedad <= 86400


token_activacion = TokenActivacionGenerator()
