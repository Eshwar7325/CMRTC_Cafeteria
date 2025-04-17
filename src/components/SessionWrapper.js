"use client";

import { SessionProvider } from "next-auth/react";
import PropTypes from "prop-types";

export default function SessionWrapper({ children }) {
    return <SessionProvider>{children}</SessionProvider>;
}

SessionWrapper.propTypes = {
    children: PropTypes.node.isRequired,
};
