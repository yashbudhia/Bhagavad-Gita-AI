import React from "react";

const Header = () => {
  return (
    <header>
      <h1 className="text-4xl md:text-3xl flex items-center justify-center text-center bg-clip-text h-10 md:h-16 text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 font-extrabold mb-1">
        PanditAI
      </h1>
      <p className="text-md leading-normal text-center text-gray-500">
        Get Answers to Life&apos;s Questions - Your AI Spiritual Companion.
      </p>
    </header>
  );
};

export default Header;
