import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class BcryptCheck {
    public static void main(String[] args) {
        BCryptPasswordEncoder enc = new BCryptPasswordEncoder();
        String hash = args[0];
        System.out.println(enc.matches("Password@123", hash));
    }
}
