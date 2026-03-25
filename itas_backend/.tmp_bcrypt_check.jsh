import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
BCryptPasswordEncoder enc = new BCryptPasswordEncoder();
System.out.println(enc.matches("Password@123", "$2a$10$Dow1H0ZK1s8AjtKoa6Hg3e5T.yGk9h9t7VDaRao7IhiHBpjz2uVH6"));
/exit
