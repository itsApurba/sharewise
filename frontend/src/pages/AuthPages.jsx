import { Box, Button, Field, Flex, Heading, Input, Stack, Text } from "@chakra-ui/react";
import { Link, Outlet } from "react-router-dom";
import ColorModeButton from "../components/ds/ColorModeButton";
import Logo from "../components/ds/Logo";
import Surface from "../components/ds/Surface";
import { toaster } from "../components/ui/toaster";

/** Frame for the signed-out screens: no app nav, one centered card. */
export const AuthLayout = () => (
  <Flex direction='column' minH='100dvh' px='4' py='5'>
    <Flex justify='space-between' align='center' w='full' maxW='wide' mx='auto'>
      <Logo />
      <ColorModeButton size='sm' />
    </Flex>
    <Flex flex='1' align='center' justify='center' py='8'>
      <Box w='full' maxW='sm'>
        <Outlet />
      </Box>
    </Flex>
  </Flex>
);

const AuthCard = ({ title, subtitle, submitLabel, footer, children }) => {
  const submit = (event) => {
    event.preventDefault();
    toaster.info({ title: "Accounts are coming soon", description: "This screen is a layout preview." });
  };
  return (
    <Stack gap='6'>
      <Stack gap='1' textAlign='center'>
        <Heading as='h1' textStyle='display'>
          {title}
        </Heading>
        <Text color='fg.muted'>{subtitle}</Text>
      </Stack>
      <Surface as='form' onSubmit={submit} p={{ base: "5", md: "6" }}>
        <Stack gap='4'>
          {children}
          <Button type='submit' rounded='full' size='lg' mt='2'>
            {submitLabel}
          </Button>
        </Stack>
      </Surface>
      <Text textAlign='center' fontSize='sm' color='fg.muted'>
        {footer}
      </Text>
    </Stack>
  );
};

const TextField = ({ label, ...inputProps }) => (
  <Field.Root>
    <Field.Label>{label}</Field.Label>
    <Input {...inputProps} />
  </Field.Root>
);

const InlineLink = ({ to, children }) => (
  <Link to={to}>
    <Text as='span' color='brand.fg' fontWeight='600'>
      {children}
    </Text>
  </Link>
);

export const LoginPage = () => (
  <AuthCard
    title='Welcome back'
    subtitle='Your reviews are waiting.'
    submitLabel='Log in'
    footer={
      <>
        New to Sharewise? <InlineLink to='/signup'>Create an account</InlineLink>
      </>
    }
  >
    <TextField label='Email' type='email' autoComplete='email' placeholder='you@example.com' />
    <TextField label='Password' type='password' autoComplete='current-password' />
  </AuthCard>
);

export const SignupPage = () => (
  <AuthCard
    title='Start remembering'
    subtitle='Share what you learn. Keep what you read.'
    submitLabel='Create account'
    footer={
      <>
        Already have an account? <InlineLink to='/login'>Log in</InlineLink>
      </>
    }
  >
    <TextField label='Name' autoComplete='name' placeholder='Ada Example' />
    <TextField label='Handle' autoComplete='username' placeholder='ada-example' />
    <TextField label='Email' type='email' autoComplete='email' placeholder='you@example.com' />
    <TextField label='Password' type='password' autoComplete='new-password' />
  </AuthCard>
);
