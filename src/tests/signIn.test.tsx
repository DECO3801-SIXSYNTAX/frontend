import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import SignIn from "../pages/SignIn";
import React from "react";


describe("SignIn Page", () => {
  test("renders email and password inputs", () => {
    render(<SignIn />);
    expect(screen.getByPlaceholderText(/Enter your email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument();
  });

  test("shows error if fields empty on submit", () => {
    render(<SignIn />);
    const button = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(button);
    expect(screen.getByText(/email and password are required/i)).toBeInTheDocument();
  });

  test("submits when email and password provided", async () => {
    render(<SignIn />);
    fireEvent.change(screen.getByPlaceholderText(/Enter your email address/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // nanti kita mock API → sementara cek log tampil
    expect(await screen.findByText(/logging in/i)).toBeInTheDocument();
  });
});
