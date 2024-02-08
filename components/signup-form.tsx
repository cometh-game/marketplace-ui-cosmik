import { useCallback, useEffect } from "react"
import { User, useCosmikSignin } from "@/services/cometh-marketplace/cosmik/signin"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import { Button } from "./ui/button"
import { Input } from "./ui/input"

interface SignUpFormProps {
  onLoginSuccess: (user: User) => void
}

export function SignUpForm({ onLoginSuccess }: SignUpFormProps) {
  const {
    mutate: signin,
    error,
    isSuccess,
    data: userData,
    isPending,
  } = useCosmikSignin()

  console.log("userData", userData)

  useEffect(() => {
    if (isSuccess && userData) {
      onLoginSuccess(userData.user)
    }
  }, [isSuccess, userData, onLoginSuccess])
  
  const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    // defaultValues: { email: "", password: "" },
  })

  const handleSubmit = useCallback(
    (data: z.infer<typeof formSchema>) => {
      signin({ username: data.email, password: data.password })
    },
    [signin]
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-2">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="password" placeholder="Password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          className="mt-4"
          type="submit"
          isLoading={isPending}
          disabled={isPending}
        >
          Connect my account
        </Button>
      </form>
    </Form>
  )
}