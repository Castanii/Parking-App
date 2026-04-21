package org.example;

import java.util.Arrays;
import java.util.Collection;

import static java.lang.Math.abs;

public class Solution {

    public int solution(int[] A)
    {
        int n = A.length;
        int sum = 0;
        int moves = 0;
        int maxnev = 0;
        for (int i=0;i<n;i++)
        {
            if(A[i]<0) {
                if (A[i] < maxnev)
                    maxnev = A[i];
                if (sum + A[i] < 0 && maxnev != 0) {
                    sum = sum + abs(maxnev);
                    sum = sum + A[i];
                    moves++;
                    maxnev = 0;
                }
                else
                    sum+=A[i];
            }
            else
                sum+=A[i];
        }
        return moves;
    }


    public String solution2(String S) {
        int n = S.length();
        int a = -1;
        int b = 1;

        int possibility = 0;
        char[] chars = S.toCharArray();
        for (int i = 0; i < n; i++) {
            possibility = 0;
            if (chars[i] == '?') {
                int j = i;
                while (j >= i - 2 && j >= 0) {
                    if (chars[j] == 'a')
                        possibility += 1;
                    if (chars[j] == 'b')
                        possibility += -1;
                    j--;
                }
                j = i;
                while (j <= i + 2 && j < n) {
                    if (chars[j] == 'a')
                        possibility += 1;
                    if (chars[j] == 'b')
                        possibility += -1;
                    j++;
                }
                if (possibility == 2)
                    chars[i] = 'b';
                else if (possibility == -2)
                    chars[i] = 'a';
                else if (possibility == 0 && i > 0 && i < n-1 && chars[i - 1] == chars[i + 1])
                    if (chars[i - 1] == 'a')
                        chars[i] = 'b';
                    else
                        chars[i] = 'a';
                    else
                    if (possibility > 0)
                        chars[i] = 'b';
                    else
                        if(possibility< 0)
                            chars[i] = 'a';
                        else
                            chars[i] = 'a';
            }


        }

      return new String(chars);
    }





//    public int solution(int[] A) {
//        int n = A.length;
//        int res = 1;
//        Arrays.sort(A);
//        for(int i=0;i<n-1;i++)
//        {
//            if(A[i]>0)
//            {
//                if(A[i]== A[i+1])
//                    continue;
//                else {
//                    if (res == A[i]) {
//                        res++;
//                    } else
//                        return res;
//                }
//            }
//        }
//        if(A[n-1]==res)
//        return res+1;
//        return res;
//    }
//    public int solution(int[][] A) {
//        int n = A.length;
//        int m = A[0].length;
//        int cnt = 0;
//        int[] row = new int[n];
//        int[] col = new int[m];
//
//
//        for (int i = 0; i < n; i++) {
//            int sum = 0;
//            for (int j = 0; j < m; j++)
//                sum += A[i][j];
//            row[i] = sum;
//        }
//
//        for (int j = 0; j < m; j++)
//        {
//            int sum = 0;
//            for (int i = 0; i <n; i++) {
//                sum += A[i][j];
//            }
//            col[j] = sum;
//        }
//
//        for (int i = 0; i < n; i++) {
//            int rowsAboveSum=0;
//            int rowsBelowSum=0;
//                for (int above =i;above>=0;above--){
//                    rowsAboveSum+=row[above];
//                }
//                for (int below =i;below<n;below++)
//                {
//                    rowsBelowSum+=row[below];
//                }
//            if(rowsAboveSum==rowsBelowSum)
//                for(int j=0;j<m;j++)
//                {
//                    int colsToLeft =0;
//                    int colsToRight =0;
//                    for (int left=0;left<j;left++)
//                        colsToLeft+=col[left];
//                    for (int right=j+1;right<m;right++)
//                        colsToRight+=col[right];
//                    if(colsToLeft==colsToRight)
//                        cnt++;
//                }
//        }
//        return cnt;
////        for(int i =0;i<n;i++)
////            System.out.print(row[i]+ " ");
////        System.out.println("coloane");
////        for(int i =0;i<m;i++)
////            System.out.print(col[i]+ " ");
//    }
}