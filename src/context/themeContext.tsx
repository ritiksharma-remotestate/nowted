import { createContext, useState,useContext } from "react";

type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

export const ThemeContext  = createContext<ThemeContextType | null>(null);

function ThemeProvider({children}: {children:React.ReactNode} ){
    const[theme,setTheme]=useState<Theme>("dark")
    const toggleTheme = () => {
        setTheme((prev) => prev === "dark"?"light":"dark")
    }
    return(
        <ThemeContext.Provider value ={{theme,toggleTheme}}>
        {children}
        </ThemeContext.Provider>
    )
}
export const useTheme = ()=>
{   
   const context= useContext(ThemeContext)
   if(!context){
    throw new Error("useTheme must be used inside ThemeProvider") ;
    
   }
   return context;

}
export default ThemeProvider