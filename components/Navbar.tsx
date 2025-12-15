import { Fragment, useEffect, useState } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCookies } from "react-cookie";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  const [cookies] = useCookies(["Token"]);

  // console.log("🚀 ~ file: Navbar.tsx:13 ~ Example ~ cookies", cookies)

  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  useEffect(() => {
    const token = cookies?.Token;
    setLoggedIn(token ? true : false);
  }, [loggedIn, cookies]);

  return (
    <Disclosure as="nav" className="bg-primary-200 ">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-gray-700"
                    href="/"
                  >
                    Home
                  </Link>
                </div>
              </div>

              <div className="flex">
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8 rounded-xl">
                  <div
                    className={`flex align-baseline ${
                      loggedIn ? "text-green-500" : " text-red-500"
                    } `}
                  >
                    <p className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium ">
                      <span
                        className={`${
                          loggedIn ? "bg-green-100" : "bg-red-100"
                        } text-sm font-medium mr-2 px-2.5 py-0.5 rounded`}
                      >
                        {loggedIn ? "Logged In" : "Log In Required"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="-mr-2 flex items-center sm:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 pt-2 pb-3">
              {/* Current: "bg-indigo-50 border-indigo-500 text-indigo-700", Default: "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700" */}

              <Disclosure.Button
                as="a"
                href="/"
                className="block border-l-4 border-primary-500 hover:bg-primary-100 py-2 pl-3 pr-4 text-base font-medium text-gray-500"
              >
                Home
              </Disclosure.Button>

              <div className="ml-2">
                <div
                  className={`flex align-baseline ${
                    loggedIn ? "text-green-500" : " text-red-500"
                  } `}
                >
                  <p className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium ">
                    <span
                      className={`${
                        loggedIn ? "bg-green-100" : "bg-red-100"
                      } text-sm font-medium mr-2 px-2.5 py-0.5 rounded`}
                    >
                      {loggedIn ? "Logged In" : "Log In Required"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
