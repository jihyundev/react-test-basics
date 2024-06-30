import "@testing-library/jest-dom"
import {createMemoryRouter, RouterProvider} from "react-router-dom";
import {render, renderHook, waitFor, screen, fireEvent} from "@testing-library/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import LoginPage from "../pages/LoginPage.tsx";
import useLogin from "../hooks/useLogin.ts";
// import nock from "nock";
import * as nock from "nock";


const queryClient = new QueryClient({
    defaultOptions: {}
});

const wrapper = ({children}) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

describe('로그인 테스트', () => {
    beforeEach(async () => {
        jest.spyOn(console, "error").mockImplementation((() => {}))
    });
    afterAll(() => {
        jest.restoreAllMocks();
    })
    test("로그인에 실패하면 에러메세지가 나타난다.", async () => {
        // given - 로그인 페이지가 그려짐
        const routes = [
            {
                path: "/login",
                element: <LoginPage/>
            }
        ]
        const router = createMemoryRouter(routes, {
            initialEntries: ["/login"],
            initialIndex: 0
        })
        render(
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router}/>
            </QueryClientProvider>
        )

        // when - 로그인에 실패함
        nock('https://server.byeongjinkang.com')
            .post('/user/login', { username: 'wrong@email.com', password: "wrongPassword" })
            .reply(400, { msg: 'NO_SUCH_USER' })

        const emailInput = screen.getByLabelText("이메일");
        const passwordInput = screen.getByLabelText("비밀번호");

        fireEvent.change(emailInput, {target: {value: "wrong@email.com" }});
        fireEvent.change(passwordInput, {target: {value: "wrongPassword"}});

        const loginButton = screen.getByRole("button", {name: "로그인"});
        fireEvent.click(loginButton);

        const {result} = renderHook(() => useLogin(), {wrapper})

        // then - 에러메세지가 나타남
        await waitFor(() => result.current.isError)
        const errorMessage = await screen.findByTestId("error-message")
        expect(errorMessage).toBeInTheDocument();
    })
});
