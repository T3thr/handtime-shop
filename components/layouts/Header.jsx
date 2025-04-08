import React from 'react';
import { options } from '@/app/api/auth/[...nextauth]/options'
import { getServerSession } from 'next-auth/next'
import NavBar from './NavBar';
import Menu from './SideBar'
import { GlobalProvider } from "@/app/GlobalProvider";

export default async function Header() {
  const session = await getServerSession(options)

  return (
    <GlobalProvider>
    <header className=' top-0 w-full flex flex-col lg:flex-row p-0 bg-white py-0 border-b z-50'>

    <div className='top-0 flex '>   
    <NavBar />
    </div>
    <div  className="fixed w-full flex lg:flex-row lg:mt-[3.3rem]  mt-8 shadow-gray-200 shadow-sm bg-gray-200 z-50">
    <Menu/>
    </div>
    </header></GlobalProvider>

  );
};